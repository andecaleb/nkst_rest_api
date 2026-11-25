import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

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

  async getMemberRoles(memberId: string) {
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

  async assignRoleToMember(
    memberId: string,
    roleName: string,
    assignedBy: string,
    scope?: { churchId?: string; groupId?: string },
  ) {
    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      throw new NotFoundException(`Role "${roleName}" not found`);
    }

    const existing = await this.prisma.memberRole.findFirst({
      where: {
        memberId,
        roleId: role.id,
        churchId: scope?.churchId ?? null,
        groupId: scope?.groupId ?? null,
      },
    });

    if (existing) return existing;

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

  async revokeRoleFromMember(memberRoleId: string) {
    const existing = await this.prisma.memberRole.findUnique({ where: { id: memberRoleId } });
    if (!existing) {
      throw new NotFoundException('Member role assignment not found');
    }
    await this.prisma.memberRole.delete({ where: { id: memberRoleId } });
    return { revoked: true, id: memberRoleId };
  }
}
