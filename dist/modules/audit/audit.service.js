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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let AuditService = class AuditService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAdminCounts(actor) {
        const memberWhere = { deletedAt: null };
        if (!actor.isPlatformAdmin) {
            memberWhere.churchId = { in: actor.administeredChurchIds };
        }
        const [byVerificationState, byState, byChurch, totalChurches, openReports] = await Promise.all([
            this.prisma.member.groupBy({
                by: ['verificationState'],
                where: memberWhere,
                _count: { id: true },
            }),
            this.prisma.member.groupBy({
                by: ['state'],
                where: memberWhere,
                _count: { id: true },
            }),
            this.prisma.member.groupBy({
                by: ['churchId'],
                where: memberWhere,
                _count: { id: true },
            }),
            this.prisma.church.count({ where: { deletedAt: null } }),
            this.prisma.report.count({ where: { status: 'open' } }),
        ]);
        return {
            totalChurches,
            openReports,
            membersByVerificationState: byVerificationState.map((r) => ({
                verificationState: r.verificationState,
                count: r._count.id,
            })),
            membersByState: byState.map((r) => ({
                state: r.state,
                count: r._count.id,
            })),
            membersByChurch: byChurch.map((r) => ({
                churchId: r.churchId,
                count: r._count.id,
            })),
        };
    }
    async listAuditLogs(limit = 50) {
        return this.prisma.auditLog.findMany({
            include: {
                actor: { select: { id: true, firstName: true, surname: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: Math.min(limit, 200),
        });
    }
    async listModerationHistory(limit = 50) {
        return this.prisma.moderationAction.findMany({
            include: {
                moderator: { select: { id: true, firstName: true, surname: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: Math.min(limit, 200),
        });
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map