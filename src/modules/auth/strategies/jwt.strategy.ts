import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import { ROLES } from '../../../common/constants/roles.constant';

export interface JwtPayload {
  sub: string;
  sessionId: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('app.jwtAccessSecret', 'nkst-dev-access-secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session has expired or been signed out');
    }

    const member = await this.prisma.member.findUnique({
      where: { id: payload.sub },
      include: {
        administeredChurches: { select: { id: true } },
        memberRoles: { include: { role: true } },
        groupMemberships: {
          where: { role: 'admin' },
          select: { groupId: true },
        },
      },
    });

    if (!member || member.deletedAt || member.deactivatedAt) {
      throw new UnauthorizedException('Account is inactive or not found');
    }

    const roles = new Set<string>([ROLES.MEMBER]);
    for (const mr of member.memberRoles) {
      roles.add(mr.role.name);
    }
    if (member.isPlatformAdmin) {
      roles.add(ROLES.PLATFORM_ADMIN);
    }
    if (member.administeredChurches.length > 0) {
      roles.add(ROLES.CHURCH_ADMIN);
    }
    if (member.groupMemberships.length > 0) {
      roles.add(ROLES.GROUP_ADMIN);
    }

    return {
      id: member.id,
      email: member.email,
      phone: member.phone,
      churchId: member.churchId,
      verificationState: member.verificationState,
      isPlatformAdmin: member.isPlatformAdmin,
      administeredChurchIds: member.administeredChurches.map((c) => c.id),
      roles: Array.from(roles),
      sessionId: session.id,
    };
  }
}
