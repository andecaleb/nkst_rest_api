import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Audience,
  CommentStatus,
  ModerationActionType,
  ModerationSubjectType,
  PhotoStatus,
  PostStatus,
  PostType,
  ReportReason,
  ReportStatus,
  ReportSubjectType,
  VerificationState,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateCommentDto,
  CreatePostDto,
  CreateReportDto,
  FilterFeedDto,
  HandleReportDto,
  ModeratePostDto,
  SharePostDto,
  ToggleReactionDto,
  UpdatePostDto,
} from './dto/communication.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UPLOAD_LIMITS } from '../../common/constants/roles.constant';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { serializeMemberCard } from '../../common/utils/privacy.util';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * POST-01..03: Create member post (held_unverified if unverified, pending_review if verified).
   */
  async createPost(user: AuthenticatedUser, dto: CreatePostDto) {
    this.validateMediaLimits(dto.type, dto.media);

    let audienceChurchId: string | null = null;
    let audienceGroupId: string | null = null;
    let isGroupAdminPost = false;

    if (dto.audience === Audience.church) {
      audienceChurchId = user.churchId;
    } else if (dto.audience === Audience.group) {
      if (!dto.audienceGroupId) {
        throw new BadRequestException('audienceGroupId is required for group-audience posts');
      }
      const membership = await this.prisma.groupMember.findUnique({
        where: { groupId_memberId: { groupId: dto.audienceGroupId, memberId: user.id } },
      });
      if (!membership) {
        throw new ForbiddenException('You must be a member of the group to post to it');
      }
      audienceGroupId = dto.audienceGroupId;
      isGroupAdminPost = membership.role === 'admin';
    }

    // Overview 4.2: unverified members' posts are saved as held_unverified
    // Group admin posts skip moderation (06-groups.md section 5)
    let status: PostStatus = PostStatus.pending_review;
    if (dto.saveAsDraft) {
      status = PostStatus.draft;
    } else if (user.verificationState !== VerificationState.verified) {
      status = PostStatus.held_unverified;
    } else if (isGroupAdminPost) {
      status = PostStatus.approved;
    }

    const post = await this.prisma.post.create({
      data: {
        authorId: user.id,
        churchId: user.churchId,
        type: dto.type,
        category: dto.category,
        audience: dto.audience,
        audienceChurchId,
        audienceGroupId,
        body: dto.body,
        status,
        approvedAt: status === PostStatus.approved ? new Date() : null,
        media: dto.media?.length
          ? {
              create: dto.media.map((m, idx) => ({
                kind: m.kind,
                fileUrl: m.fileUrl,
                fileName: m.fileName,
                mimeType: m.mimeType,
                sizeBytes: m.sizeBytes,
                position: m.position ?? idx,
              })),
            }
          : undefined,
      },
      include: { author: true, media: true },
    });

    return { ...post, author: serializeMemberCard(post.author, user) };
  }

  /**
   * Feeds: Home feed (approved posts from member's church, joined groups, and general audience).
   */
  async getHomeFeed(query: FilterFeedDto, viewer?: AuthenticatedUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: any = {
      status: PostStatus.approved,
      deletedAt: null,
    };

    if (query.category) where.category = query.category;
    if (query.type) where.type = query.type;

    if (query.churchId) {
      where.OR = [
        { audience: Audience.church, audienceChurchId: query.churchId },
        { churchId: query.churchId, audience: Audience.church },
      ];
    } else if (query.groupId) {
      const group = await this.prisma.group.findUnique({ where: { id: query.groupId } });
      if (!group) throw new NotFoundException('Group not found');
      if (group.visibility === 'private') {
        const isMember = viewer
          ? await this.prisma.groupMember.findUnique({
              where: { groupId_memberId: { groupId: group.id, memberId: viewer.id } },
            })
          : null;
        if (!isMember && !viewer?.isPlatformAdmin) {
          throw new ForbiddenException('Private group posts are only visible to group members');
        }
      }
      where.audience = Audience.group;
      where.audienceGroupId = query.groupId;
    } else if (viewer) {
      const memberships = await this.prisma.groupMember.findMany({
        where: { memberId: viewer.id },
        select: { groupId: true },
      });
      const groupIds = memberships.map((m) => m.groupId);
      where.OR = [
        { audience: Audience.general },
        { audience: Audience.church, audienceChurchId: viewer.churchId },
        ...(groupIds.length ? [{ audience: Audience.group, audienceGroupId: { in: groupIds } }] : []),
      ];
    } else {
      where.audience = Audience.general;
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          author: { include: { church: { select: { id: true, name: true } } } },
          media: { orderBy: { position: 'asc' } },
          _count: { select: { comments: { where: { status: CommentStatus.visible } } } },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: posts.map((p) => ({
        ...p,
        author: serializeMemberCard(p.author, viewer),
      })),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * POST-07: Editing an approved post sends it back to pending_review (hidden until re-approved).
   */
  async updatePost(postId: string, user: AuthenticatedUser, dto: UpdatePostDto) {
    const post = await this.prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== user.id) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    const nextStatus =
      post.status === PostStatus.approved || post.status === PostStatus.needs_correction
        ? PostStatus.pending_review
        : post.status;

    return this.prisma.post.update({
      where: { id: postId },
      data: {
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        status: nextStatus,
      },
    });
  }

  async softDeletePost(postId: string, user: AuthenticatedUser) {
    const post = await this.prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
    if (!post) throw new NotFoundException('Post not found');
    const isAdmin =
      user.isPlatformAdmin || user.administeredChurchIds.includes(post.churchId);
    if (post.authorId !== user.id && !isAdmin) {
      throw new ForbiddenException('Not authorized to delete this post');
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: { status: PostStatus.removed, deletedAt: new Date() },
    });
    return { deleted: true, id: postId };
  }

  /**
   * POST-05: Moderation queue (newest first, filterable by type & category).
   */
  async getModerationQueue(actor: AuthenticatedUser, query: FilterFeedDto) {
    const where: any = {
      status: PostStatus.pending_review,
      deletedAt: null,
    };
    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category;

    if (!actor.isPlatformAdmin) {
      const adminGroupIds = (
        await this.prisma.groupMember.findMany({
          where: { memberId: actor.id, role: 'admin' },
          select: { groupId: true },
        })
      ).map((g) => g.groupId);

      where.OR = [
        {
          audience: { in: [Audience.general, Audience.church] },
          churchId: { in: actor.administeredChurchIds },
        },
        ...(adminGroupIds.length
          ? [{ audience: Audience.group, audienceGroupId: { in: adminGroupIds } }]
          : []),
      ];
    }

    const posts = await this.prisma.post.findMany({
      where,
      include: { author: true, media: true },
      orderBy: { createdAt: 'desc' },
    });

    return posts.map((p) => ({ ...p, author: serializeMemberCard(p.author, actor) }));
  }

  /**
   * POST-03, POST-04, POST-06, POST-08: Moderate post and record moderation history.
   */
  async moderatePost(postId: string, actor: AuthenticatedUser, dto: ModeratePostDto) {
    const post = await this.prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
    if (!post) throw new NotFoundException('Post not found');

    await this.assertCanModeratePost(actor, post);

    if (
      (dto.action === ModerationActionType.reject ||
        dto.action === ModerationActionType.request_correction) &&
      !dto.reason
    ) {
      throw new BadRequestException('A reason is required when rejecting or requesting corrections');
    }

    const statusMap: Record<ModerationActionType, PostStatus> = {
      approve: PostStatus.approved,
      reject: PostStatus.rejected,
      request_correction: PostStatus.needs_correction,
      hide: PostStatus.removed,
      remove: PostStatus.removed,
    };

    const nextStatus = statusMap[dto.action];

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.post.update({
        where: { id: postId },
        data: {
          status: nextStatus,
          ...(nextStatus === PostStatus.approved ? { approvedAt: new Date() } : {}),
        },
      });

      await tx.moderationAction.create({
        data: {
          subjectType: ModerationSubjectType.post,
          subjectId: postId,
          moderatorId: actor.id,
          action: dto.action,
          reason: dto.reason,
        },
      });

      await tx.notification.create({
        data: {
          memberId: post.authorId,
          type: `post_${dto.action}`,
          subjectType: 'post',
          subjectId: postId,
          title: `Post ${dto.action.replace('_', ' ')}`,
          body: dto.reason
            ? `Moderator note: ${dto.reason}`
            : `Your post status is now ${nextStatus}.`,
        },
      });

      return p;
    });

    return updated;
  }

  async getPostModerationHistory(postId: string) {
    return this.prisma.moderationAction.findMany({
      where: { subjectType: ModerationSubjectType.post, subjectId: postId },
      include: { moderator: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * COM-01..05: Add comment or 1-level reply. Unverified members' comments are held_unverified.
   */
  async addComment(postId: string, user: AuthenticatedUser, dto: CreateCommentDto) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, status: PostStatus.approved, deletedAt: null },
    });
    if (!post) throw new NotFoundException('Approved post not found');

    let parentAuthorId: string | null = null;
    if (dto.parentCommentId) {
      const parent = await this.prisma.comment.findUnique({ where: { id: dto.parentCommentId } });
      if (!parent || parent.postId !== postId) {
        throw new NotFoundException('Parent comment not found');
      }
      if (parent.parentCommentId) {
        throw new BadRequestException('Only one level of comment replies is supported (COM-02)');
      }
      parentAuthorId = parent.authorId;
    }

    const status =
      user.verificationState === VerificationState.verified
        ? CommentStatus.visible
        : CommentStatus.held_unverified;

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId: user.id,
        parentCommentId: dto.parentCommentId,
        body: dto.body,
        status,
      },
      include: { author: true },
    });

    if (status === CommentStatus.visible) {
      if (post.authorId !== user.id) {
        await this.prisma.notification.create({
          data: {
            memberId: post.authorId,
            type: 'new_comment',
            subjectType: 'post',
            subjectId: postId,
            title: 'New Comment on Your Post',
            body: 'Someone commented on your post.',
          },
        });
      }
      if (parentAuthorId && parentAuthorId !== user.id && parentAuthorId !== post.authorId) {
        await this.prisma.notification.create({
          data: {
            memberId: parentAuthorId,
            type: 'new_reply',
            subjectType: 'comment',
            subjectId: comment.id,
            title: 'New Reply to Your Comment',
            body: 'Someone replied to your comment.',
          },
        });
      }
    }

    return { ...comment, author: serializeMemberCard(comment.author, user) };
  }

  async listComments(postId: string, viewer?: AuthenticatedUser) {
    const comments = await this.prisma.comment.findMany({
      where: {
        postId,
        parentCommentId: null,
        deletedAt: null,
        OR: [
          { status: CommentStatus.visible },
          ...(viewer ? [{ authorId: viewer.id, status: CommentStatus.held_unverified }] : []),
        ],
      },
      include: {
        author: true,
        replies: {
          where: { status: CommentStatus.visible, deletedAt: null },
          include: { author: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return comments.map((c) => ({
      ...c,
      author: serializeMemberCard(c.author, viewer),
      replies: c.replies.map((r) => ({ ...r, author: serializeMemberCard(r.author, viewer) })),
    }));
  }

  /**
   * REA-01: One reaction (like/amen/love) per member per post or comment, changeable.
   */
  async toggleReaction(user: AuthenticatedUser, dto: ToggleReactionDto) {
    const existing = await this.prisma.reaction.findUnique({
      where: {
        subjectType_subjectId_memberId: {
          subjectType: dto.subjectType,
          subjectId: dto.subjectId,
          memberId: user.id,
        },
      },
    });

    if (existing && existing.kind === dto.kind) {
      await this.prisma.reaction.delete({ where: { id: existing.id } });
      return { removed: true, kind: dto.kind };
    }

    const reaction = await this.prisma.reaction.upsert({
      where: {
        subjectType_subjectId_memberId: {
          subjectType: dto.subjectType,
          subjectId: dto.subjectId,
          memberId: user.id,
        },
      },
      update: { kind: dto.kind },
      create: {
        subjectType: dto.subjectType,
        subjectId: dto.subjectId,
        memberId: user.id,
        kind: dto.kind,
      },
    });

    return reaction;
  }

  /**
   * SHA-01: Share an approved post to profile feed, preserving original audience limits.
   */
  async sharePost(postId: string, user: AuthenticatedUser, dto: SharePostDto) {
    const original = await this.prisma.post.findFirst({
      where: { id: postId, status: PostStatus.approved, deletedAt: null },
    });
    if (!original) throw new NotFoundException('Approved post not found');

    const status =
      user.verificationState === VerificationState.verified
        ? PostStatus.pending_review
        : PostStatus.held_unverified;

    return this.prisma.post.create({
      data: {
        authorId: user.id,
        churchId: user.churchId,
        type: PostType.text,
        category: original.category,
        audience: original.audience,
        audienceChurchId: original.audienceChurchId,
        audienceGroupId: original.audienceGroupId,
        body: dto.note,
        sharedFromPostId: original.id,
        status,
      },
    });
  }

  /**
   * REP-01..03 & GAL-14: Report post, comment, or photo.
   * Minor removal requests on photos immediately hide the photo pending review.
   */
  async createReport(user: AuthenticatedUser, dto: CreateReportDto) {
    const report = await this.prisma.report.create({
      data: {
        subjectType: dto.subjectType,
        subjectId: dto.subjectId,
        reporterId: user.id,
        reason: dto.reason,
        detail: dto.detail,
      },
    });

    // GAL-14: Pictured person/guardian removal request hides photo immediately pending review
    if (
      dto.subjectType === ReportSubjectType.photo &&
      dto.reason === ReportReason.minor_removal_request
    ) {
      await this.prisma.photo.updateMany({
        where: { id: dto.subjectId },
        data: { status: PhotoStatus.pending_review },
      });
    }

    return report;
  }

  async getReportsQueue(status: ReportStatus = ReportStatus.open) {
    return this.prisma.report.findMany({
      where: { status },
      include: { reporter: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async handleReport(reportId: string, actor: AuthenticatedUser, dto: HandleReportDto) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    return this.prisma.$transaction(async (tx) => {
      if (dto.decision === 'hide' || dto.decision === 'remove') {
        if (report.subjectType === ReportSubjectType.post) {
          await tx.post.update({
            where: { id: report.subjectId },
            data: { status: PostStatus.removed },
          });
        } else if (report.subjectType === ReportSubjectType.comment) {
          await tx.comment.update({
            where: { id: report.subjectId },
            data: {
              status: dto.decision === 'hide' ? CommentStatus.hidden : CommentStatus.removed,
            },
          });
        } else if (report.subjectType === ReportSubjectType.photo) {
          await tx.photo.update({
            where: { id: report.subjectId },
            data: { status: PhotoStatus.removed },
          });
        }
      }

      return tx.report.update({
        where: { id: reportId },
        data: {
          status: dto.decision === 'dismiss' ? ReportStatus.dismissed : ReportStatus.actioned,
          handledById: actor.id,
          handledAt: new Date(),
          resolutionNote: dto.resolutionNote,
        },
      });
    });
  }

  private validateMediaLimits(type: PostType, media?: CreatePostDto['media']) {
    if (!media || media.length === 0) return;

    if (type === PostType.image) {
      if (media.length > UPLOAD_LIMITS.IMAGE_MAX_COUNT) {
        throw new BadRequestException(`Maximum ${UPLOAD_LIMITS.IMAGE_MAX_COUNT} images per post`);
      }
      for (const m of media) {
        if (m.sizeBytes > UPLOAD_LIMITS.IMAGE_MAX_BYTES) {
          throw new BadRequestException('Each image must be 10 MB or smaller');
        }
      }
    } else if (type === PostType.video) {
      if (media.length > 1 || media[0].sizeBytes > UPLOAD_LIMITS.VIDEO_MAX_BYTES) {
        throw new BadRequestException('Video posts allow 1 video up to 100 MB');
      }
    } else if (type === PostType.document) {
      if (media.length > 1 || media[0].sizeBytes > UPLOAD_LIMITS.DOCUMENT_MAX_BYTES) {
        throw new BadRequestException('Document posts allow 1 document (.docx, .xlsx, .pdf) up to 20 MB');
      }
    }
  }

  private async assertCanModeratePost(
    actor: AuthenticatedUser,
    post: { churchId: string; audience: Audience; audienceGroupId: string | null },
  ) {
    if (actor.isPlatformAdmin) return;
    if (post.audience === Audience.group && post.audienceGroupId) {
      const gm = await this.prisma.groupMember.findUnique({
        where: { groupId_memberId: { groupId: post.audienceGroupId, memberId: actor.id } },
      });
      if (gm?.role === 'admin') return;
      throw new ForbiddenException('Group posts are moderated by the Group Admin (POST-03)');
    }
    if (actor.administeredChurchIds.includes(post.churchId)) return;
    throw new ForbiddenException('Only the author’s Church Admin can moderate this post (POST-03)');
  }
}
