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
exports.IdentityService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const pagination_util_1 = require("../../common/utils/pagination.util");
const privacy_util_1 = require("../../common/utils/privacy.util");
const roles_constant_1 = require("../../common/constants/roles.constant");
let IdentityService = class IdentityService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getNigerianLocations() {
        return roles_constant_1.NIGERIAN_STATES_LGAS;
    }
    async listChurches(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const where = { deletedAt: null };
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { town: { contains: query.search, mode: 'insensitive' } },
                { lga: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        if (query.state)
            where.state = { equals: query.state, mode: 'insensitive' };
        if (query.lga)
            where.lga = { equals: query.lga, mode: 'insensitive' };
        if (query.town)
            where.town = { contains: query.town, mode: 'insensitive' };
        if (query.status)
            where.status = query.status;
        const [items, total] = await Promise.all([
            this.prisma.church.findMany({
                where,
                include: {
                    adminMember: {
                        select: {
                            id: true,
                            firstName: true,
                            middleName: true,
                            surname: true,
                            photoUrl: true,
                            churchId: true,
                            verificationState: true,
                            profileVisibility: true,
                        },
                    },
                },
                orderBy: [{ isHeadquarters: 'desc' }, { name: 'asc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.church.count({ where }),
        ]);
        return {
            data: items.map((c) => ({
                ...c,
                adminMember: (0, privacy_util_1.serializeMemberCard)(c.adminMember),
            })),
            meta: (0, pagination_util_1.buildPaginationMeta)(total, page, limit),
        };
    }
    async getChurchMapPins(state) {
        return this.prisma.church.findMany({
            where: {
                deletedAt: null,
                latitude: { not: null },
                longitude: { not: null },
                ...(state ? { state: { equals: state, mode: 'insensitive' } } : {}),
            },
            select: {
                id: true,
                name: true,
                state: true,
                lga: true,
                town: true,
                latitude: true,
                longitude: true,
                isHeadquarters: true,
                status: true,
            },
        });
    }
    async getChurchDetail(churchId, viewer) {
        const church = await this.prisma.church.findFirst({
            where: { id: churchId, deletedAt: null },
            include: {
                adminMember: true,
                gallery: { select: { id: true } },
            },
        });
        if (!church) {
            throw new common_1.NotFoundException('Church not found');
        }
        const [verifiedMemberCount, recentPosts, galleryPreview, recentResources, marketplaceCount] = await Promise.all([
            this.prisma.member.count({
                where: {
                    churchId,
                    verificationState: client_1.VerificationState.verified,
                    deactivatedAt: null,
                    deletedAt: null,
                },
            }),
            this.prisma.post.findMany({
                where: {
                    OR: [{ audienceChurchId: churchId }, { churchId, audience: 'church' }],
                    status: client_1.PostStatus.approved,
                    deletedAt: null,
                },
                include: { author: true, media: true },
                orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
                take: 5,
            }),
            this.prisma.photo.findMany({
                where: { churchId, status: client_1.PhotoStatus.approved, deletedAt: null },
                orderBy: { createdAt: 'desc' },
                take: 6,
            }),
            this.prisma.resource.findMany({
                where: { churchId, status: client_1.ResourceStatus.approved, deletedAt: null },
                orderBy: { createdAt: 'desc' },
                take: 6,
            }),
            this.prisma.resource.count({
                where: {
                    churchId,
                    status: client_1.ResourceStatus.approved,
                    access: 'paid',
                    isListingPaused: false,
                    isHiddenByAdmin: false,
                    deletedAt: null,
                },
            }),
        ]);
        return {
            ...church,
            adminMember: (0, privacy_util_1.serializeMemberCard)(church.adminMember, viewer),
            verifiedMemberCount,
            recentPosts: recentPosts.map((p) => ({
                ...p,
                author: (0, privacy_util_1.serializeMemberCard)(p.author, viewer),
            })),
            galleryPreview,
            recentResources,
            marketplaceListingsCount: marketplaceCount,
        };
    }
    async createChurch(dto, actorId) {
        const existing = await this.prisma.church.findUnique({
            where: { name_lga: { name: dto.name, lga: dto.lga } },
        });
        if (existing) {
            throw new common_1.ConflictException(`A church named "${dto.name}" already exists in ${dto.lga} LGA`);
        }
        const church = await this.prisma.church.create({
            data: {
                ...dto,
                gallery: { create: {} },
            },
            include: { gallery: true },
        });
        await this.prisma.auditLog.create({
            data: {
                actorId,
                action: 'church:create',
                entityType: 'church',
                entityId: church.id,
                metadata: { name: church.name, state: church.state, lga: church.lga },
            },
        });
        return church;
    }
    async updateChurch(churchId, dto, user) {
        const church = await this.prisma.church.findFirst({
            where: { id: churchId, deletedAt: null },
        });
        if (!church) {
            throw new common_1.NotFoundException('Church not found');
        }
        const isPlatformAdmin = user.isPlatformAdmin;
        const isChurchAdmin = church.adminMemberId === user.id;
        if (!isPlatformAdmin && !isChurchAdmin) {
            throw new common_1.ForbiddenException('Only the Platform Admin or this church admin can update church details');
        }
        if (!isPlatformAdmin && (dto.name || dto.state || dto.lga || dto.status)) {
            throw new common_1.ForbiddenException('Only the Platform Admin may change church name, state, LGA, or status (CHR-09)');
        }
        const updated = await this.prisma.church.update({
            where: { id: churchId },
            data: dto,
        });
        await this.prisma.auditLog.create({
            data: {
                actorId: user.id,
                action: 'church:update',
                entityType: 'church',
                entityId: churchId,
                metadata: dto,
            },
        });
        return updated;
    }
    async assignChurchAdmin(churchId, dto, actorId) {
        const [church, member, churchAdminRole] = await Promise.all([
            this.prisma.church.findFirst({ where: { id: churchId, deletedAt: null } }),
            this.prisma.member.findFirst({ where: { id: dto.memberId, deletedAt: null } }),
            this.prisma.role.findUnique({ where: { name: roles_constant_1.ROLES.CHURCH_ADMIN } }),
        ]);
        if (!church)
            throw new common_1.NotFoundException('Church not found');
        if (!member)
            throw new common_1.NotFoundException('Member not found');
        const previousAdminId = church.adminMemberId;
        const updated = await this.prisma.$transaction(async (tx) => {
            const updatedChurch = await tx.church.update({
                where: { id: churchId },
                data: { adminMemberId: member.id },
                include: { adminMember: true },
            });
            if (churchAdminRole) {
                if (previousAdminId && previousAdminId !== member.id) {
                    await tx.memberRole.deleteMany({
                        where: {
                            memberId: previousAdminId,
                            roleId: churchAdminRole.id,
                            churchId,
                        },
                    });
                }
                const existingRole = await tx.memberRole.findFirst({
                    where: { memberId: member.id, roleId: churchAdminRole.id, churchId },
                });
                if (!existingRole) {
                    await tx.memberRole.create({
                        data: {
                            memberId: member.id,
                            roleId: churchAdminRole.id,
                            churchId,
                            assignedBy: actorId,
                        },
                    });
                }
            }
            await tx.auditLog.create({
                data: {
                    actorId,
                    action: 'church:assign_admin',
                    entityType: 'church',
                    entityId: churchId,
                    metadata: { previousAdminId, newAdminId: member.id },
                },
            });
            return updatedChurch;
        });
        return {
            ...updated,
            adminMember: (0, privacy_util_1.serializeMemberCard)(updated.adminMember),
        };
    }
    async deactivateChurch(churchId, actorId) {
        const church = await this.prisma.church.findFirst({ where: { id: churchId, deletedAt: null } });
        if (!church)
            throw new common_1.NotFoundException('Church not found');
        const updated = await this.prisma.church.update({
            where: { id: churchId },
            data: { status: client_1.ChurchStatus.inactive },
        });
        await this.prisma.auditLog.create({
            data: {
                actorId,
                action: 'church:deactivate',
                entityType: 'church',
                entityId: churchId,
            },
        });
        return updated;
    }
};
exports.IdentityService = IdentityService;
exports.IdentityService = IdentityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IdentityService);
//# sourceMappingURL=identity.service.js.map