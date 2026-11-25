import { BadRequestException } from '@nestjs/common';
import {
  Audience,
  MediaKind,
  PostCategory,
  PostStatus,
  PostType,
  VerificationState,
} from '@prisma/client';
import { PostsService } from '../../src/modules/communication/posts.service';
import { AuthenticatedUser } from '../../src/common/decorators/current-user.decorator';

describe('PostsService (Unit)', () => {
  let service: PostsService;
  let prisma: any;

  const verifiedUser: AuthenticatedUser = {
    id: 'user-1',
    email: 'v@example.com',
    phone: '+2348001',
    churchId: 'church-1',
    verificationState: VerificationState.verified,
    isPlatformAdmin: false,
    administeredChurchIds: [],
    roles: ['MEMBER'],
  };

  beforeEach(() => {
    prisma = {
      post: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      comment: { findUnique: jest.fn(), create: jest.fn() },
    };
    service = new PostsService(prisma);
  });

  it('rejects image uploads exceeding 10 MB limit (05-posts-comments-moderation.md)', async () => {
    await expect(
      service.createPost(verifiedUser, {
        type: PostType.image,
        category: PostCategory.general,
        audience: Audience.church,
        media: [
          {
            kind: MediaKind.image,
            fileUrl: 'https://cdn.nkst.org.ng/huge.jpg',
            fileName: 'huge.jpg',
            mimeType: 'image/jpeg',
            sizeBytes: 12 * 1024 * 1024,
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('saves unverified member posts as held_unverified (Overview 4.2)', async () => {
    prisma.post.create.mockImplementation(({ data }: any) => ({
      id: 'post-1',
      ...data,
      author: {
        id: 'user-unv',
        firstName: 'A',
        surname: 'B',
        churchId: 'church-1',
        verificationState: VerificationState.registered,
        profileVisibility: 'public',
      },
    }));

    const post = await service.createPost(
      { ...verifiedUser, id: 'user-unv', verificationState: VerificationState.registered },
      {
        type: PostType.text,
        category: PostCategory.general,
        audience: Audience.church,
        body: 'Hello church!',
      },
    );

    expect(post.status).toBe(PostStatus.held_unverified);
  });

  it('sends an edited approved post back to pending_review (POST-07)', async () => {
    prisma.post.findFirst.mockResolvedValue({
      id: 'post-1',
      authorId: verifiedUser.id,
      status: PostStatus.approved,
    });
    prisma.post.update.mockImplementation(({ data }: any) => ({ id: 'post-1', ...data }));

    const updated = await service.updatePost('post-1', verifiedUser, { body: 'Edited text' });
    expect(updated.status).toBe(PostStatus.pending_review);
  });

  it('enforces single-level comment replies (COM-02)', async () => {
    prisma.post.findFirst.mockResolvedValue({ id: 'post-1', authorId: 'author-2' });
    prisma.comment.findUnique.mockResolvedValue({
      id: 'reply-1',
      postId: 'post-1',
      parentCommentId: 'root-comment-1', // Already a reply!
    });

    await expect(
      service.addComment('post-1', verifiedUser, {
        body: 'Nested reply',
        parentCommentId: 'reply-1',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
