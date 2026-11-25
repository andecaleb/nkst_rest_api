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
exports.ResourcesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../database/prisma.service");
const privacy_util_1 = require("../../../common/utils/privacy.util");
let ResourcesService = class ResourcesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createResource(user, dto) {
        if (dto.access === client_1.ResourceAccess.paid && (dto.price === undefined || dto.price <= 0)) {
            throw new common_1.BadRequestException('Paid resources require a positive NGN price (informational)');
        }
        if (dto.format === client_1.ResourceFormat.hard_copy && dto.stock === undefined) {
            throw new common_1.BadRequestException('Hard copy resources require a stock quantity');
        }
        const isChurchAdmin = user.isPlatformAdmin || user.administeredChurchIds.includes(user.churchId);
        const isChurchOwned = Boolean(dto.isChurchOwned && isChurchAdmin);
        let status = client_1.ResourceStatus.draft;
        if (user.verificationState !== client_1.VerificationState.verified) {
            status = client_1.ResourceStatus.held_unverified;
        }
        else if (isChurchOwned) {
            status = client_1.ResourceStatus.approved;
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
                price: dto.access === client_1.ResourceAccess.paid ? dto.price : null,
                currency: 'NGN',
                stock: dto.format === client_1.ResourceFormat.hard_copy ? dto.stock : null,
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
    async getMyLibrary(user) {
        return this.prisma.resource.findMany({
            where: { ownerId: user.id, deletedAt: null },
            include: { files: true, church: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async submitToChurch(resourceId, user) {
        if (user.verificationState !== client_1.VerificationState.verified) {
            throw new common_1.ForbiddenException('You must be a verified member to submit resources to your church');
        }
        const resource = await this.prisma.resource.findFirst({
            where: { id: resourceId, ownerId: user.id, deletedAt: null },
        });
        if (!resource)
            throw new common_1.NotFoundException('Resource not found');
        return this.prisma.resource.update({
            where: { id: resourceId },
            data: { status: client_1.ResourceStatus.submitted },
        });
    }
    async updateResource(resourceId, user, dto) {
        const resource = await this.prisma.resource.findFirst({
            where: { id: resourceId, ownerId: user.id, deletedAt: null },
        });
        if (!resource)
            throw new common_1.NotFoundException('Resource not found');
        const sensitiveChange = dto.files !== undefined ||
            (dto.price !== undefined && Number(dto.price) !== Number(resource.price));
        const nextStatus = resource.status === client_1.ResourceStatus.approved && sensitiveChange
            ? client_1.ResourceStatus.pending_review
            : resource.status === client_1.ResourceStatus.rejected
                ? client_1.ResourceStatus.draft
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
    async archiveResource(resourceId, user) {
        const resource = await this.prisma.resource.findFirst({
            where: { id: resourceId, ownerId: user.id, deletedAt: null },
        });
        if (!resource)
            throw new common_1.NotFoundException('Resource not found');
        return this.prisma.resource.update({
            where: { id: resourceId },
            data: { status: client_1.ResourceStatus.archived },
        });
    }
    async getReviewQueue(actor) {
        const where = {
            status: { in: [client_1.ResourceStatus.submitted, client_1.ResourceStatus.pending_review] },
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
        return items.map((r) => ({ ...r, owner: (0, privacy_util_1.serializeMemberCard)(r.owner, actor) }));
    }
    async reviewResource(resourceId, actor, dto) {
        const resource = await this.prisma.resource.findFirst({
            where: { id: resourceId, deletedAt: null },
        });
        if (!resource)
            throw new common_1.NotFoundException('Resource not found');
        if (!actor.isPlatformAdmin && !actor.administeredChurchIds.includes(resource.churchId)) {
            throw new common_1.ForbiddenException('Only the Church Admin can review resources for this church');
        }
        if (dto.decision === 'reject' && !dto.reason) {
            throw new common_1.BadRequestException('A rejection reason is required');
        }
        const nextStatus = dto.decision === 'approve' ? client_1.ResourceStatus.approved : client_1.ResourceStatus.rejected;
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
                    subjectType: client_1.ModerationSubjectType.resource,
                    subjectId: resourceId,
                    moderatorId: actor.id,
                    action: dto.decision === 'approve'
                        ? client_1.ModerationActionType.approve
                        : client_1.ModerationActionType.reject,
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
                    body: dto.decision === 'approve'
                        ? `"${resource.title}" is now published in the Church Collection & Central Library.`
                        : `"${resource.title}" was declined. Reason: ${dto.reason}`,
                },
            });
            return updated;
        });
    }
    async browseCentralLibrary(filters, viewer) {
        const resources = await this.prisma.resource.findMany({
            where: {
                status: client_1.ResourceStatus.approved,
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
            owner: (0, privacy_util_1.serializeMemberCard)(r.owner, viewer),
            files: r.files.filter((f) => f.isPreviewImage),
        }));
    }
    async getResourceDownloadFiles(resourceId, user) {
        const resource = await this.prisma.resource.findFirst({
            where: { id: resourceId, status: client_1.ResourceStatus.approved, deletedAt: null },
            include: { files: true },
        });
        if (!resource)
            throw new common_1.NotFoundException('Approved resource not found');
        if (resource.ownerId === user.id || user.isPlatformAdmin) {
            return resource.files;
        }
        if (user.verificationState !== client_1.VerificationState.verified) {
            throw new common_1.ForbiddenException('Only verified members can download resources (RES-11)');
        }
        if (resource.access === client_1.ResourceAccess.free && resource.format === client_1.ResourceFormat.digital) {
            return resource.files;
        }
        const fulfilledOrder = await this.prisma.order.findFirst({
            where: {
                resourceId,
                buyerId: user.id,
                status: { in: [client_1.OrderStatus.accepted, client_1.OrderStatus.fulfilled] },
            },
        });
        if (!fulfilledOrder) {
            throw new common_1.ForbiddenException('This paid resource cannot be downloaded until the seller accepts your marketplace request (RES-12)');
        }
        return resource.files;
    }
};
exports.ResourcesService = ResourcesService;
exports.ResourcesService = ResourcesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ResourcesService);
//# sourceMappingURL=resources.service.js.map