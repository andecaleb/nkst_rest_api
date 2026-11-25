"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const roles_constant_1 = require("../../common/constants/roles.constant");
const pagination_util_1 = require("../../common/utils/pagination.util");
const privacy_util_1 = require("../../common/utils/privacy.util");
let PostsService = class PostsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPost(user, dto) {
        this.validateMediaLimits(dto.type, dto.media);
        let audienceChurchId = null;
        let audienceGroupId = null;
        let isGroupAdminPost = false;
        if (dto.audience === client_1.Audience.church) {
            audienceChurchId = user.churchId;
        }
        else if (dto.audience === client_1.Audience.group) {
            if (!dto.audienceGroupId) {
                throw new common_1.BadRequestException('audienceGroupId is required for group-audience posts');
            }
            const membership = await this.prisma.groupMember.findUnique({
                where: { groupId_memberId: { groupId: dto.audienceGroupId, memberId: user.id } },
            });
            if (!membership) {
                throw new common_1.ForbiddenException('You must be a member of the group to post to it');
            }
            audienceGroupId = dto.audienceGroupId;
            isGroupAdminPost = membership.role === 'admin';
        }
        let status = client_1.PostStatus.pending_review;
        if (dto.saveAsDraft) {
            status = client_1.PostStatus.draft;
        }
        else if (user.verificationState !== client_1.VerificationState.verified) {
            status = client_1.PostStatus.held_unverified;
        }
        else if (isGroupAdminPost) {
            status = client_1.PostStatus.approved;
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
                approvedAt: status === client_1.PostStatus.approved ? new Date() : null,
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
        return { ...post, author: (0, privacy_util_1.serializeMemberCard)(post.author, user) };
    }
    async getHomeFeed(query, viewer) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const where = {
            status: client_1.PostStatus.approved,
            deletedAt: null,
        };
        if (query.category)
            where.category = query.category;
        if (query.type)
            where.type = query.type;
        if (query.churchId) {
            where.OR = [
                { audience: client_1.Audience.church, audienceChurchId: query.churchId },
                { churchId: query.churchId, audience: client_1.Audience.church },
            ];
        }
        else if (query.groupId) {
            const group = await this.prisma.group.findUnique({ where: { id: query.groupId } });
            if (!group)
                throw new common_1.NotFoundException('Group not found');
            if (group.visibility === 'private') {
                const isMember = viewer
                    ? await this.prisma.groupMember.findUnique({
                        where: { groupId_memberId: { groupId: group.id, memberId: viewer.id } },
                    })
                    : null;
                if (!isMember && !viewer?.isPlatformAdmin) {
                    throw new common_1.ForbiddenException('Private group posts are only visible to group members');
                }
            }
            where.audience = client_1.Audience.group;
            where.audienceGroupId = query.groupId;
        }
        else if (viewer) {
            const memberships = await this.prisma.groupMember.findMany({
                where: { memberId: viewer.id },
                select: { groupId: true },
            });
            const groupIds = memberships.map((m) => m.groupId);
            where.OR = [
                { audience: client_1.Audience.general },
                { audience: client_1.Audience.church, audienceChurchId: viewer.churchId },
                ...(groupIds.length ? [{ audience: client_1.Audience.group, audienceGroupId: { in: groupIds } }] : []),
            ];
        }
        else {
            where.audience = client_1.Audience.general;
        }
        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where,
                include: {
                    author: { include: { church: { select: { id: true, name: true } } } },
                    media: { orderBy: { position: 'asc' } },
                    _count: { select: { comments: { where: { status: client_1.CommentStatus.visible } } } },
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
                author: (0, privacy_util_1.serializeMemberCard)(p.author, viewer),
            })),
            meta: (0, pagination_util_1.buildPaginationMeta)(total, page, limit),
        };
    }
    async updatePost(postId, user, dto) {
        const post = await this.prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        if (post.authorId !== user.id) {
            throw new common_1.ForbiddenException('You can only edit your own posts');
        }
        const nextStatus = post.status === client_1.PostStatus.approved || post.status === client_1.PostStatus.needs_correction
            ? client_1.PostStatus.pending_review
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
    async softDeletePost(postId, user) {
        const post = await this.prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        const isAdmin = user.isPlatformAdmin || user.administeredChurchIds.includes(post.churchId);
        if (post.authorId !== user.id && !isAdmin) {
            throw new common_1.ForbiddenException('Not authorized to delete this post');
        }
        await this.prisma.post.update({
            where: { id: postId },
            data: { status: client_1.PostStatus.removed, deletedAt: new Date() },
        });
        return { deleted: true, id: postId };
    }
    async getModerationQueue(actor, query) {
        const where = {
            status: client_1.PostStatus.pending_review,
            deletedAt: null,
        };
        if (query.type)
            where.type = query.type;
        if (query.category)
            where.category = query.category;
        if (!actor.isPlatformAdmin) {
            const adminGroupIds = (await this.prisma.groupMember.findMany({
                where: { memberId: actor.id, role: 'admin' },
                select: { groupId: true },
            })).map((g) => g.groupId);
            where.OR = [
                {
                    audience: { in: [client_1.Audience.general, client_1.Audience.church] },
                    churchId: { in: actor.administeredChurchIds },
                },
                ...(adminGroupIds.length
                    ? [{ audience: client_1.Audience.group, audienceGroupId: { in: adminGroupIds } }]
                    : []),
            ];
        }
        const posts = await this.prisma.post.findMany({
            where,
            include: { author: true, media: true },
            orderBy: { createdAt: 'desc' },
        });
        return posts.map((p) => ({ ...p, author: (0, privacy_util_1.serializeMemberCard)(p.author, actor) }));
    }
    async moderatePost(postId, actor, dto) {
        const post = await this.prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        await this.assertCanModeratePost(actor, post);
        if ((dto.action === client_1.ModerationActionType.reject ||
            dto.action === client_1.ModerationActionType.request_correction) &&
            !dto.reason) {
            throw new common_1.BadRequestException('A reason is required when rejecting or requesting corrections');
        }
        const statusMap = {
            approve: client_1.PostStatus.approved,
            reject: client_1.PostStatus.rejected,
            request_correction: client_1.PostStatus.needs_correction,
            hide: client_1.PostStatus.removed,
            remove: client_1.PostStatus.removed,
        };
        const nextStatus = statusMap[dto.action];
        const updated = await this.prisma.$transaction(async (tx) => {
            const p = await tx.post.update({
                where: { id: postId },
                data: {
                    status: nextStatus,
                    ...(nextStatus === client_1.PostStatus.approved ? { approvedAt: new Date() } : {}),
                },
            });
            await tx.moderationAction.create({
                data: {
                    subjectType: client_1.ModerationSubjectType.post,
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
    async getPostModerationHistory(postId) {
        return this.prisma.moderationAction.findMany({
            where: { subjectType: client_1.ModerationSubjectType.post, subjectId: postId },
            include: { moderator: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async addComment(postId, user, dto) {
        const post = await this.prisma.post.findFirst({
            where: { id: postId, status: client_1.PostStatus.approved, deletedAt: null },
        });
        if (!post)
            throw new common_1.NotFoundException('Approved post not found');
        let parentAuthorId = null;
        if (dto.parentCommentId) {
            const parent = await this.prisma.comment.findUnique({ where: { id: dto.parentCommentId } });
            if (!parent || parent.postId !== postId) {
                throw new common_1.NotFoundException('Parent comment not found');
            }
            if (parent.parentCommentId) {
                throw new common_1.BadRequestException('Only one level of comment replies is supported (COM-02)');
            }
            parentAuthorId = parent.authorId;
        }
        const status = user.verificationState === client_1.VerificationState.verified
            ? client_1.CommentStatus.visible
            : client_1.CommentStatus.held_unverified;
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
        if (status === client_1.CommentStatus.visible) {
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
        return { ...comment, author: (0, privacy_util_1.serializeMemberCard)(comment.author, user) };
    }
    async listComments(postId, viewer) {
        const comments = await this.prisma.comment.findMany({
            where: {
                postId,
                parentCommentId: null,
                deletedAt: null,
                OR: [
                    { status: client_1.CommentStatus.visible },
                    ...(viewer ? [{ authorId: viewer.id, status: client_1.CommentStatus.held_unverified }] : []),
                ],
            },
            include: {
                author: true,
                replies: {
                    where: { status: client_1.CommentStatus.visible, deletedAt: null },
                    include: { author: true },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        return comments.map((c) => ({
            ...c,
            author: (0, privacy_util_1.serializeMemberCard)(c.author, viewer),
            replies: c.replies.map((r) => ({ ...r, author: (0, privacy_util_1.serializeMemberCard)(r.author, viewer) })),
        }));
    }
    async toggleReaction(user, dto) {
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
    async sharePost(postId, user, dto) {
        const original = await this.prisma.post.findFirst({
            where: { id: postId, status: client_1.PostStatus.approved, deletedAt: null },
        });
        if (!original)
            throw new common_1.NotFoundException('Approved post not found');
        const status = user.verificationState === client_1.VerificationState.verified
            ? client_1.PostStatus.pending_review
            : client_1.PostStatus.held_unverified;
        return this.prisma.post.create({
            data: {
                authorId: user.id,
                churchId: user.churchId,
                type: client_1.PostType.text,
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
    async createReport(user, dto) {
        const report = await this.prisma.report.create({
            data: {
                subjectType: dto.subjectType,
                subjectId: dto.subjectId,
                reporterId: user.id,
                reason: dto.reason,
                detail: dto.detail,
            },
        });
        if (dto.subjectType === client_1.ReportSubjectType.photo &&
            dto.reason === client_1.ReportReason.minor_removal_request) {
            await this.prisma.photo.updateMany({
                where: { id: dto.subjectId },
                data: { status: client_1.PhotoStatus.pending_review },
            });
        }
        return report;
    }
    async getReportsQueue(status = client_1.ReportStatus.open) {
        return this.prisma.report.findMany({
            where: { status },
            include: { reporter: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async handleReport(reportId, actor, dto) {
        const report = await this.prisma.report.findUnique({ where: { id: reportId } });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        return this.prisma.$transaction(async (tx) => {
            if (dto.decision === 'hide' || dto.decision === 'remove') {
                if (report.subjectType === client_1.ReportSubjectType.post) {
                    await tx.post.update({
                        where: { id: report.subjectId },
                        data: { status: client_1.PostStatus.removed },
                    });
                }
                else if (report.subjectType === client_1.ReportSubjectType.comment) {
                    await tx.comment.update({
                        where: { id: report.subjectId },
                        data: {
                            status: dto.decision === 'hide' ? client_1.CommentStatus.hidden : client_1.CommentStatus.removed,
                        },
                    });
                }
                else if (report.subjectType === client_1.ReportSubjectType.photo) {
                    await tx.photo.update({
                        where: { id: report.subjectId },
                        data: { status: client_1.PhotoStatus.removed },
                    });
                }
            }
            return tx.report.update({
                where: { id: reportId },
                data: {
                    status: dto.decision === 'dismiss' ? client_1.ReportStatus.dismissed : client_1.ReportStatus.actioned,
                    handledById: actor.id,
                    handledAt: new Date(),
                    resolutionNote: dto.resolutionNote,
                },
            });
        });
    }
    validateMediaLimits(type, media) {
        if (!media || media.length === 0)
            return;
        if (type === client_1.PostType.image) {
            if (media.length > roles_constant_1.UPLOAD_LIMITS.IMAGE_MAX_COUNT) {
                throw new common_1.BadRequestException(`Maximum ${roles_constant_1.UPLOAD_LIMITS.IMAGE_MAX_COUNT} images per post`);
            }
            for (const m of media) {
                if (m.sizeBytes > roles_constant_1.UPLOAD_LIMITS.IMAGE_MAX_BYTES) {
                    throw new common_1.BadRequestException('Each image must be 10 MB or smaller');
                }
            }
        }
        else if (type === client_1.PostType.video) {
            if (media.length > 1 || media[0].sizeBytes > roles_constant_1.UPLOAD_LIMITS.VIDEO_MAX_BYTES) {
                throw new common_1.BadRequestException('Video posts allow 1 video up to 100 MB');
            }
        }
        else if (type === client_1.PostType.document) {
            if (media.length > 1 || media[0].sizeBytes > roles_constant_1.UPLOAD_LIMITS.DOCUMENT_MAX_BYTES) {
                throw new common_1.BadRequestException('Document posts allow 1 document (.docx, .xlsx, .pdf) up to 20 MB');
            }
        }
    }
    async assertCanModeratePost(actor, post) {
        if (actor.isPlatformAdmin)
            return;
        if (post.audience === client_1.Audience.group && post.audienceGroupId) {
            const gm = await this.prisma.groupMember.findUnique({
                where: { groupId_memberId: { groupId: post.audienceGroupId, memberId: actor.id } },
            });
            if (gm?.role === 'admin')
                return;
            throw new common_1.ForbiddenException('Group posts are moderated by the Group Admin (POST-03)');
        }
        if (actor.administeredChurchIds.includes(post.churchId))
            return;
        throw new common_1.ForbiddenException('Only the author’s Church Admin can moderate this post (POST-03)');
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PostsService);
//# sourceMappingURL=posts.service.js.map