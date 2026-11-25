import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ChurchStatus, TokenChannel, TokenPurpose, VerificationState } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import {
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  RequestOtpDto,
  ResetPasswordDto,
  VerifyAccountDto,
} from './dto/auth.dto';
import { serializeMember } from '../../common/utils/privacy.util';
import { ROLES } from '../../common/constants/roles.constant';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * MEM-01..07: Register a new member affiliated with an active church.
   */
  async register(dto: RegisterDto) {
    const church = await this.prisma.church.findFirst({
      where: { id: dto.churchId, deletedAt: null },
    });

    if (!church) {
      throw new NotFoundException('Selected church does not exist');
    }
    if (church.status !== ChurchStatus.active) {
      throw new BadRequestException(
        'Selected church is currently inactive and does not accept new registrations (CHR-07)',
      );
    }

    const existing = await this.prisma.member.findFirst({
      where: {
        OR: [{ email: dto.email.toLowerCase() }, { phone: dto.phone }],
      },
    });
    if (existing) {
      throw new ConflictException('A member with this email or phone number already exists (MEM-06)');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const memberRole = await this.prisma.role.findUnique({ where: { name: ROLES.MEMBER } });

    const member = await this.prisma.member.create({
      data: {
        firstName: dto.firstName,
        middleName: dto.middleName,
        surname: dto.surname,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        passwordHash,
        gender: dto.gender,
        dateOfBirth: new Date(dto.dateOfBirth),
        state: dto.state,
        lga: dto.lga,
        residentialLocation: dto.residentialLocation,
        churchId: church.id,
        photoUrl: dto.photoUrl,
        verificationState: VerificationState.registered,
        notificationPreference: { create: {} },
        ...(memberRole
          ? {
              memberRoles: {
                create: { roleId: memberRole.id, churchId: church.id },
              },
            }
          : {}),
      },
      include: { church: true },
    });

    const channel = dto.verificationChannel || TokenChannel.email;
    const otpCode = await this.createOtpToken(member.id, channel, TokenPurpose.account_verify);

    return {
      message: `Registration successful. Verify your ${channel} using the OTP code to activate your account.`,
      member: serializeMember(member, {
        id: member.id,
        email: member.email,
        phone: member.phone,
        churchId: member.churchId,
        verificationState: member.verificationState,
        isPlatformAdmin: false,
        administeredChurchIds: [],
        roles: [ROLES.MEMBER],
      }),
      // Returned in non-production environments to simplify testing
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: otpCode } : {}),
    };
  }

  /**
   * MEM-05: Verify email or phone via OTP to activate account.
   */
  async verifyAccount(dto: VerifyAccountDto) {
    const member = await this.findByIdentifier(dto.identifier);
    if (!member) {
      throw new NotFoundException('Account not found');
    }

    await this.verifyOtpToken(member.id, dto.code, TokenPurpose.account_verify);

    const updated = await this.prisma.member.update({
      where: { id: member.id },
      data:
        dto.channel === TokenChannel.email
          ? { emailVerifiedAt: new Date() }
          : { phoneVerifiedAt: new Date() },
    });

    return {
      verified: true,
      channel: dto.channel,
      emailVerifiedAt: updated.emailVerifiedAt,
      phoneVerifiedAt: updated.phoneVerifiedAt,
    };
  }

  async resendVerificationOtp(dto: RequestOtpDto) {
    const member = await this.findByIdentifier(dto.identifier);
    if (!member) {
      throw new NotFoundException('Account not found');
    }
    const otpCode = await this.createOtpToken(member.id, dto.channel, TokenPurpose.account_verify);
    return {
      message: `Verification code sent via ${dto.channel}.`,
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: otpCode } : {}),
    };
  }

  /**
   * AUTH-01, AUTH-03, AUTH-04, AUTH-06: Login with email or phone + password.
   */
  async login(dto: LoginDto, ipAddress?: string) {
    const member = await this.findByIdentifier(dto.identifier);
    if (!member || member.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, member.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!member.emailVerifiedAt && !member.phoneVerifiedAt) {
      throw new ForbiddenException(
        'Please verify your email or phone number before logging in (MEM-05)',
      );
    }

    // AUTH-04: Reactivate deactivated account on login
    let reactivated = false;
    if (member.deactivatedAt) {
      await this.prisma.member.update({
        where: { id: member.id },
        data: { deactivatedAt: null },
      });
      reactivated = true;
    }

    const tokens = await this.issueSessionTokens(member.id, member.email, dto.deviceInfo, ipAddress);

    return {
      ...tokens,
      reactivated,
      suspensionNotice:
        member.verificationState === VerificationState.suspended
          ? {
              suspended: true,
              readOnly: true,
              reason: member.suspensionReason || 'Account suspended by administrator',
            }
          : null,
      member: serializeMember(member, {
        id: member.id,
        email: member.email,
        phone: member.phone,
        churchId: member.churchId,
        verificationState: member.verificationState,
        isPlatformAdmin: member.isPlatformAdmin,
        administeredChurchIds: [],
        roles: [ROLES.MEMBER],
      }),
    };
  }

  /**
   * AUTH-03: Refresh access token using refresh token rotation.
   */
  async refreshTokens(dto: RefreshTokenDto) {
    let payload: { sub: string; sessionId: string; email: string };
    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>('app.jwtRefreshSecret', 'nkst-dev-refresh-secret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session has been revoked or expired');
    }

    const hashMatch = await bcrypt.compare(dto.refreshToken, session.refreshTokenHash);
    if (!hashMatch) {
      throw new UnauthorizedException('Refresh token mismatch');
    }

    const newRefreshToken = this.jwtService.sign(
      { sub: payload.sub, sessionId: session.id, email: payload.email },
      {
        secret: this.configService.get<string>('app.jwtRefreshSecret', 'nkst-dev-refresh-secret'),
        expiresIn: this.configService.get<string>('app.jwtRefreshExpiresIn', '30d') as any,
      },
    );

    const newAccessToken = this.jwtService.sign(
      { sub: payload.sub, sessionId: session.id, email: payload.email },
      {
        secret: this.configService.get<string>('app.jwtAccessSecret', 'nkst-dev-access-secret'),
        expiresIn: this.configService.get<string>('app.jwtAccessExpiresIn', '1d') as any,
      },
    );

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: await bcrypt.hash(newRefreshToken, 10),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
    };
  }

  /**
   * AUTH-03 & NOT-04: Sign out current session (and optionally remove device token).
   */
  async logout(memberId: string, sessionId?: string, deviceToken?: string) {
    if (sessionId) {
      await this.prisma.session.updateMany({
        where: { id: sessionId, memberId },
        data: { revokedAt: new Date() },
      });
    }
    if (deviceToken) {
      await this.prisma.deviceToken.deleteMany({
        where: { memberId, token: deviceToken },
      });
    }
    return { signedOut: true };
  }

  /**
   * AUTH-03: Sign out of all devices.
   */
  async logoutAll(memberId: string) {
    await this.prisma.$transaction([
      this.prisma.session.updateMany({
        where: { memberId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.deviceToken.deleteMany({ where: { memberId } }),
    ]);
    return { signedOutAllDevices: true };
  }

  /**
   * AUTH-02: Request password recovery OTP.
   */
  async requestPasswordReset(dto: RequestOtpDto) {
    const member = await this.findByIdentifier(dto.identifier);
    if (!member) {
      return { message: 'If an account matches that identifier, a reset code has been sent.' };
    }
    const otpCode = await this.createOtpToken(member.id, dto.channel, TokenPurpose.password_reset);
    return {
      message: 'If an account matches that identifier, a reset code has been sent.',
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: otpCode } : {}),
    };
  }

  /**
   * AUTH-02: Complete password reset and revoke all active sessions.
   */
  async resetPassword(dto: ResetPasswordDto) {
    const member = await this.findByIdentifier(dto.identifier);
    if (!member) {
      throw new NotFoundException('Account not found');
    }

    await this.verifyOtpToken(member.id, dto.code, TokenPurpose.password_reset);
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.member.update({
        where: { id: member.id },
        data: { passwordHash },
      }),
      this.prisma.session.updateMany({
        where: { memberId: member.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Password has been reset. Please log in with your new password.' };
  }

  /**
   * AUTH-04: Account deactivation by member (content hidden, reactivated on next login).
   */
  async deactivateAccount(memberId: string) {
    await this.prisma.$transaction([
      this.prisma.member.update({
        where: { id: memberId },
        data: { deactivatedAt: new Date() },
      }),
      this.prisma.session.updateMany({
        where: { memberId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return {
      deactivated: true,
      message: 'Account deactivated. Log in again at any time to reactivate.',
    };
  }

  async listSessions(memberId: string) {
    return this.prisma.session.findMany({
      where: { memberId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async issueSessionTokens(
    memberId: string,
    email: string,
    deviceInfo?: string,
    ipAddress?: string,
  ) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const placeholderHash = crypto.randomBytes(16).toString('hex');

    const session = await this.prisma.session.create({
      data: {
        memberId,
        refreshTokenHash: placeholderHash,
        deviceInfo,
        ipAddress,
        expiresAt,
      },
    });

    const payload = { sub: memberId, sessionId: session.id, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('app.jwtAccessSecret', 'nkst-dev-access-secret'),
      expiresIn: this.configService.get<string>('app.jwtAccessExpiresIn', '1d') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('app.jwtRefreshSecret', 'nkst-dev-refresh-secret'),
      expiresIn: this.configService.get<string>('app.jwtRefreshExpiresIn', '30d') as any,
    });

    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshTokenHash: await bcrypt.hash(refreshToken, 10) },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      sessionId: session.id,
    };
  }

  private async findByIdentifier(identifier: string) {
    const trimmed = identifier.trim();
    return this.prisma.member.findFirst({
      where: {
        OR: [{ email: trimmed.toLowerCase() }, { phone: trimmed }],
      },
      include: { church: true },
    });
  }

  private async createOtpToken(
    memberId: string,
    channel: TokenChannel,
    purpose: TokenPurpose,
  ): Promise<string> {
    const code = String(crypto.randomInt(100000, 999999));
    const codeHash = await bcrypt.hash(code, 10);
    const expiresMinutes = this.configService.get<number>('app.otpExpiresMinutes', 15);

    await this.prisma.verificationToken.create({
      data: {
        memberId,
        channel,
        purpose,
        codeHash,
        expiresAt: new Date(Date.now() + expiresMinutes * 60 * 1000),
      },
    });

    return code;
  }

  private async verifyOtpToken(memberId: string, code: string, purpose: TokenPurpose) {
    const token = await this.prisma.verificationToken.findFirst({
      where: {
        memberId,
        purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!token) {
      throw new BadRequestException('Verification code is invalid or expired');
    }

    if (token.attempts >= 5) {
      throw new BadRequestException('Too many failed attempts. Please request a new code.');
    }

    const match = await bcrypt.compare(code, token.codeHash);
    if (!match) {
      await this.prisma.verificationToken.update({
        where: { id: token.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid verification code');
    }

    await this.prisma.verificationToken.update({
      where: { id: token.id },
      data: { consumedAt: new Date() },
    });
  }
}
