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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let RolesService = class RolesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listRoles() {
        return this.prisma.role.findMany({
            include: {
                permissions: {
                    include: { permission: true },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    async listPermissions() {
        return this.prisma.permission.findMany({
            orderBy: { code: 'asc' },
        });
    }
    async getMemberRoles(memberId) {
        return this.prisma.memberRole.findMany({
            where: { memberId },
            include: {
                role: {
                    include: {
                        permissions: { include: { permission: true } },
                    },
                },
            },
        });
    }
    async assignRoleToMember(memberId, roleName, assignedBy, scope) {
        const role = await this.prisma.role.findUnique({ where: { name: roleName } });
        if (!role) {
            throw new common_1.NotFoundException(`Role "${roleName}" not found`);
        }
        const existing = await this.prisma.memberRole.findFirst({
            where: {
                memberId,
                roleId: role.id,
                churchId: scope?.churchId ?? null,
                groupId: scope?.groupId ?? null,
            },
        });
        if (existing)
            return existing;
        return this.prisma.memberRole.create({
            data: {
                memberId,
                roleId: role.id,
                churchId: scope?.churchId,
                groupId: scope?.groupId,
                assignedBy,
            },
            include: { role: true },
        });
    }
    async revokeRoleFromMember(memberRoleId) {
        const existing = await this.prisma.memberRole.findUnique({ where: { id: memberRoleId } });
        if (!existing) {
            throw new common_1.NotFoundException('Member role assignment not found');
        }
        await this.prisma.memberRole.delete({ where: { id: memberRoleId } });
        return { revoked: true, id: memberRoleId };
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesService);
//# sourceMappingURL=roles.service.js.map