import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ModerationActionType,
  ModerationSubjectType,
  OrderStatus,
  ResourceAccess,
  ResourceCategory,
  ResourceFormat,
  ResourceStatus,
  ResourceType,
  VerificationState,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateResourceDto, ReviewResourceDto, UpdateResourceDto } from './resources.dto';
import { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import { serializeMemberCard } from '../../../common/utils/privacy.util';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * RES-01..03, RES-08: Create a resource in Personal Library (or Church-owned if Church Admin).
   */
  async createResource(user: AuthenticatedUser, dto: CreateResourceDto) {
    if (dto.access === ResourceAccess.paid && (dto.price === undefined || dto.price <= 0)) {
      throw new BadRequestException('Paid resources require a positive NGN price (informational)');
    }
    if (dto.format === ResourceFormat.hard_copy && dto.stock === undefined) {
      throw new BadRequestException('Hard copy resources require a stock quantity');
    }

    const isChurchAdmin =
      user.isPlatformAdmin || user.administeredChurchIds.includes(user.churchId);
    const isChurchOwned = Boolean(dto.isChurchOwned && isChurchAdmin);

    let status: ResourceStatus = ResourceStatus.draft;
    if (user.verificationState !== VerificationState.verified) {
      status = ResourceStatus.held_unverified;
    } else if (isChurchOwned) {
      status = ResourceStatus.approved; // RES-08: Church-owned resources publish without review
    }

    return this.prisma.resource.create({
      data: {
        ownerId: user.id,
        churchId: user.churchId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        resourceType: dto.resourceType,
        format: dto.format,
        access: dto.access,
        price: dto.access === ResourceAccess.paid ? dto.price : null,
        currency: 'NGN',
        stock: dto.format === ResourceFormat.hard_copy ? dto.stock : null,
        status,
        isChurchOwned,
        files: dto.files?.length
          ? {
              create: dto.files.map((f) => ({
                fileUrl: f.fileUrl,
                fileName: f.fileName,
                mimeType: f.mimeType,
                sizeBytes: f.sizeBytes,
                isPreviewImage: Boolean(f.isPreviewImage),
              })),
            }
          : undefined,
      },
      include: { files: true },
    });
  }

  /**
   * RES-01: Member's Personal Library (My Library).
   */
  async getMyLibrary(user: AuthenticatedUser) {
    return this.prisma.resource.findMany({
      where: { ownerId: user.id, deletedAt: null },
      include: { files: true, church: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * RES-04: Submit a personal resource to the church collection (requires verified status).
   */
  async submitToChurch(resourceId: string, user: AuthenticatedUser) {
    if (user.verificationState !== VerificationState.verified) {
      throw new ForbiddenException('You must be a verified member to submit resources to your church');
    }

    const resource = await this.prisma.resource.findFirst({
      where: { id: resourceId, ownerId: user.id, deletedAt: null },
    });
    if (!resource) throw new NotFoundException('Resource not found');

    return this.prisma.resource.update({
      where: { id: resourceId },
      data: { status: ResourceStatus.submitted },
    });
  }

  /**
   * RES-14: Editing an approved resource's file or price sends it back to pending_review.
   */
  async updateResource(resourceId: string, user: AuthenticatedUser, dto: UpdateResourceDto) {
    const resource = await this.prisma.resource.findFirst({
      where: { id: resourceId, ownerId: user.id, deletedAt: null },
    });
    if (!resource) throw new NotFoundException('Resource not found');

    const sensitiveChange =
      dto.files !== undefined ||
      (dto.price !== undefined && Number(dto.price) !== Number(resource.price));

    const nextStatus =
      resource.status === ResourceStatus.approved && sensitiveChange
        ? ResourceStatus.pending_review
        : resource.status === ResourceStatus.rejected
          ? ResourceStatus.draft
          : resource.status;

    return this.prisma.$transaction(async (tx) => {
      if (dto.files) {
        await tx.resourceFile.deleteMany({ where: { resourceId } });
      }
      return tx.resource.update({
        where: { id: resourceId },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.category !== undefined ? { category: dto.category } : {}),
          ...(dto.price !== undefined ? { price: dto.price } : {}),
          ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
          status: nextStatus,
          ...(dto.files
            ? {
                files: {
                  create: dto.files.map((f) => ({
                    fileUrl: f.fileUrl,
                    fileName: f.fileName,
                    mimeType: f.mimeType,
                    sizeBytes: f.sizeBytes,
                    isPreviewImage: Boolean(f.isPreviewImage),
                  })),
                },
              }
            : {}),
        },
        include: { files: true },
      });
    });
  }

  /**
   * RES-07: Owner can archive/withdraw their resource while keeping it in their library.
   */
  async archiveResource(resourceId: string, user: AuthenticatedUser) {
    const resource = await this.prisma.resource.findFirst({
      where: { id: resourceId, ownerId: user.id, deletedAt: null },
    });
    if (!resource) throw new NotFoundException('Resource not found');
    return this.prisma.resource.update({
      where: { id: resourceId },
      data: { status: ResourceStatus.archived },
    });
  }

  /**
   * RES-05: Church Admin resource review queue.
   */
  async getReviewQueue(actor: AuthenticatedUser) {
    const where: any = {
      status: { in: [ResourceStatus.submitted, ResourceStatus.pending_review] },
      deletedAt: null,
    };
    if (!actor.isPlatformAdmin) {
      where.churchId = { in: actor.administeredChurchIds };
    }
    const items = await this.prisma.resource.findMany({
      where,
      include: { owner: true, files: true },
      orderBy: { createdAt: 'asc' },
    });
    return items.map((r) => ({ ...r, owner: serializeMemberCard(r.owner, actor) }));
  }

  async reviewResource(resourceId: string, actor: AuthenticatedUser, dto: ReviewResourceDto) {
    const resource = await this.prisma.resource.findFirst({
      where: { id: resourceId, deletedAt: null },
    });
    if (!resource) throw new NotFoundException('Resource not found');

    if (!actor.isPlatformAdmin && !actor.administeredChurchIds.includes(resource.churchId)) {
      throw new ForbiddenException('Only the Church Admin can review resources for this church');
    }
    if (dto.decision === 'reject' && !dto.reason) {
      throw new BadRequestException('A rejection reason is required');
    }

    const nextStatus =
      dto.decision === 'approve' ? ResourceStatus.approved : ResourceStatus.rejected;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.resource.update({
        where: { id: resourceId },
        data: {
          status: nextStatus,
          reviewedById: actor.id,
          reviewNote: dto.reason,
          ...(dto.category ? { category: dto.category } : {}),
        },
      });

      await tx.moderationAction.create({
        data: {
          subjectType: ModerationSubjectType.resource,
          subjectId: resourceId,
          moderatorId: actor.id,
          action:
            dto.decision === 'approve'
              ? ModerationActionType.approve
              : ModerationActionType.reject,
          reason: dto.reason,
        },
      });

      await tx.notification.create({
        data: {
          memberId: resource.ownerId,
          type: `resource_${dto.decision}d`,
          subjectType: 'resource',
          subjectId: resourceId,
          title: dto.decision === 'approve' ? 'Resource Approved' : 'Resource Declined',
          body:
            dto.decision === 'approve'
              ? `"${resource.title}" is now published in the Church Collection & Central Library.`
              : `"${resource.title}" was declined. Reason: ${dto.reason}`,
        },
      });

      return updated;
    });
  }

  /**
   * RES-06, RES-09, RES-10, RES-15: Central Library (approved resources only, filterable & searchable).
   * Paid digital resource files are redacted from the listing until an order is accepted.
   */
  async browseCentralLibrary(
    filters: {
      search?: string;
      churchId?: string;
      category?: ResourceCategory;
      resourceType?: ResourceType;
      access?: ResourceAccess;
      format?: ResourceFormat;
      ownerId?: string;
      inStock?: boolean;
    },
    viewer?: AuthenticatedUser,
  ) {
    const resources = await this.prisma.resource.findMany({
      where: {
        status: ResourceStatus.approved,
        isHiddenByAdmin: false,
        deletedAt: null,
        ...(filters.churchId ? { churchId: filters.churchId } : {}),
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.resourceType ? { resourceType: filters.resourceType } : {}),
        ...(filters.access ? { access: filters.access } : {}),
        ...(filters.format ? { format: filters.format } : {}),
        ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
        ...(filters.inStock ? { stock: { gt: 0 } } : {}),
        ...(filters.search
          ? {
              OR: [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        owner: true,
        church: { select: { id: true, name: true } },
        files: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return resources.map((r) => ({
      ...r,
      owner: serializeMemberCard(r.owner, viewer),
      // RES-11 & RES-12: Visitors see listings only; paid files hidden until order accepted
      files: r.files.filter((f) => f.isPreviewImage),
    }));
  }

  /**
   * RES-11, RES-12: Download/access digital resource files.
   * - Free digital: any verified member (or owner)
   * - Paid digital: owner OR buyer with accepted/fulfilled order only!
   */
  async getResourceDownloadFiles(resourceId: string, user: AuthenticatedUser) {
    const resource = await this.prisma.resource.findFirst({
      where: { id: resourceId, status: ResourceStatus.approved, deletedAt: null },
      include: { files: true },
    });
    if (!resource) throw new NotFoundException('Approved resource not found');

    if (resource.ownerId === user.id || user.isPlatformAdmin) {
      return resource.files;
    }

    if (user.verificationState !== VerificationState.verified) {
      throw new ForbiddenException('Only verified members can download resources (RES-11)');
    }

    if (resource.access === ResourceAccess.free && resource.format === ResourceFormat.digital) {
      return resource.files;
    }

    // Paid digital resource: requires accepted/fulfilled order
    const fulfilledOrder = await this.prisma.order.findFirst({
      where: {
        resourceId,
        buyerId: user.id,
        status: { in: [OrderStatus.accepted, OrderStatus.fulfilled] },
      },
    });

    if (!fulfilledOrder) {
      throw new ForbiddenException(
        'This paid resource cannot be downloaded until the seller accepts your marketplace request (RES-12)',
      );
    }

    return resource.files;
  }
}
