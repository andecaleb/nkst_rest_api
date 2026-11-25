import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Phase 6 (12-delivery-plan.md): Basic counts for admins — members by church, state, and verification state.
   */
  async getAdminCounts(actor: AuthenticatedUser) {
    const memberWhere: any = { deletedAt: null };
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
}
