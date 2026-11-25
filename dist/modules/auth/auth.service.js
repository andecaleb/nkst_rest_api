"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../../database/prisma.service");
const privacy_util_1 = require("../../common/utils/privacy.util");
const roles_constant_1 = require("../../common/constants/roles.constant");
let AuthService = class AuthService {
    prisma;
    jwtService;
    configService;
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(dto) {
        const church = await this.prisma.church.findFirst({
            where: { id: dto.churchId, deletedAt: null },
        });
        if (!church) {
            throw new common_1.NotFoundException('Selected church does not exist');
        }
        if (church.status !== client_1.ChurchStatus.active) {
            throw new common_1.BadRequestException('Selected church is currently inactive and does not accept new registrations (CHR-07)');
        }
        const existing = await this.prisma.member.findFirst({
            where: {
                OR: [{ email: dto.email.toLowerCase() }, { phone: dto.phone }],
            },
        });
        if (existing) {
            throw new common_1.ConflictException('A member with this email or phone number already exists (MEM-06)');
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const memberRole = await this.prisma.role.findUnique({ where: { name: roles_constant_1.ROLES.MEMBER } });
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
                verificationState: client_1.VerificationState.registered,
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
        const channel = dto.verificationChannel || client_1.TokenChannel.email;
        const otpCode = await this.createOtpToken(member.id, channel, client_1.TokenPurpose.account_verify);
        return {
            message: `Registration successful. Verify your ${channel} using the OTP code to activate your account.`,
            member: (0, privacy_util_1.serializeMember)(member, {
                id: member.id,
                email: member.email,
                phone: member.phone,
                churchId: member.churchId,
                verificationState: member.verificationState,
                isPlatformAdmin: false,
                administeredChurchIds: [],
                roles: [roles_constant_1.ROLES.MEMBER],
            }),
            ...(process.env.NODE_ENV !== 'production' ? { devOtp: otpCode } : {}),
        };
    }
    async verifyAccount(dto) {
        const member = await this.findByIdentifier(dto.identifier);
        if (!member) {
            throw new common_1.NotFoundException('Account not found');
        }
        await this.verifyOtpToken(member.id, dto.code, client_1.TokenPurpose.account_verify);
        const updated = await this.prisma.member.update({
            where: { id: member.id },
            data: dto.channel === client_1.TokenChannel.email
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
    async resendVerificationOtp(dto) {
        const member = await this.findByIdentifier(dto.identifier);
        if (!member) {
            throw new common_1.NotFoundException('Account not found');
        }
        const otpCode = await this.createOtpToken(member.id, dto.channel, client_1.TokenPurpose.account_verify);
        return {
            message: `Verification code sent via ${dto.channel}.`,
            ...(process.env.NODE_ENV !== 'production' ? { devOtp: otpCode } : {}),
        };
    }
    async login(dto, ipAddress) {
        const member = await this.findByIdentifier(dto.identifier);
        if (!member || member.deletedAt) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const passwordValid = await bcrypt.compare(dto.password, member.passwordHash);
        if (!passwordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!member.emailVerifiedAt && !member.phoneVerifiedAt) {
            throw new common_1.ForbiddenException('Please verify your email or phone number before logging in (MEM-05)');
        }
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
            suspensionNotice: member.verificationState === client_1.VerificationState.suspended
                ? {
                    suspended: true,
                    readOnly: true,
                    reason: member.suspensionReason || 'Account suspended by administrator',
                }
                : null,
            member: (0, privacy_util_1.serializeMember)(member, {
                id: member.id,
                email: member.email,
                phone: member.phone,
                churchId: member.churchId,
                verificationState: member.verificationState,
                isPlatformAdmin: member.isPlatformAdmin,
                administeredChurchIds: [],
                roles: [roles_constant_1.ROLES.MEMBER],
            }),
        };
    }
    async refreshTokens(dto) {
        let payload;
        try {
            payload = this.jwtService.verify(dto.refreshToken, {
                secret: this.configService.get('app.jwtRefreshSecret', 'nkst-dev-refresh-secret'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        const session = await this.prisma.session.findUnique({
            where: { id: payload.sessionId },
        });
        if (!session || session.revokedAt || session.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Session has been revoked or expired');
        }
        const hashMatch = await bcrypt.compare(dto.refreshToken, session.refreshTokenHash);
        if (!hashMatch) {
            throw new common_1.UnauthorizedException('Refresh token mismatch');
        }
        const newRefreshToken = this.jwtService.sign({ sub: payload.sub, sessionId: session.id, email: payload.email }, {
            secret: this.configService.get('app.jwtRefreshSecret', 'nkst-dev-refresh-secret'),
            expiresIn: this.configService.get('app.jwtRefreshExpiresIn', '30d'),
        });
        const newAccessToken = this.jwtService.sign({ sub: payload.sub, sessionId: session.id, email: payload.email }, {
            secret: this.configService.get('app.jwtAccessSecret', 'nkst-dev-access-secret'),
            expiresIn: this.configService.get('app.jwtAccessExpiresIn', '1d'),
        });
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
    async logout(memberId, sessionId, deviceToken) {
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
    async logoutAll(memberId) {
        await this.prisma.$transaction([
            this.prisma.session.updateMany({
                where: { memberId, revokedAt: null },
                data: { revokedAt: new Date() },
            }),
            this.prisma.deviceToken.deleteMany({ where: { memberId } }),
        ]);
        return { signedOutAllDevices: true };
    }
    async requestPasswordReset(dto) {
        const member = await this.findByIdentifier(dto.identifier);
        if (!member) {
            return { message: 'If an account matches that identifier, a reset code has been sent.' };
        }
        const otpCode = await this.createOtpToken(member.id, dto.channel, client_1.TokenPurpose.password_reset);
        return {
            message: 'If an account matches that identifier, a reset code has been sent.',
            ...(process.env.NODE_ENV !== 'production' ? { devOtp: otpCode } : {}),
        };
    }
    async resetPassword(dto) {
        const member = await this.findByIdentifier(dto.identifier);
        if (!member) {
            throw new common_1.NotFoundException('Account not found');
        }
        await this.verifyOtpToken(member.id, dto.code, client_1.TokenPurpose.password_reset);
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
    async deactivateAccount(memberId) {
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
    async listSessions(memberId) {
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
    async issueSessionTokens(memberId, email, deviceInfo, ipAddress) {
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
            secret: this.configService.get('app.jwtAccessSecret', 'nkst-dev-access-secret'),
            expiresIn: this.configService.get('app.jwtAccessExpiresIn', '1d'),
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('app.jwtRefreshSecret', 'nkst-dev-refresh-secret'),
            expiresIn: this.configService.get('app.jwtRefreshExpiresIn', '30d'),
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
    async findByIdentifier(identifier) {
        const trimmed = identifier.trim();
        return this.prisma.member.findFirst({
            where: {
                OR: [{ email: trimmed.toLowerCase() }, { phone: trimmed }],
            },
            include: { church: true },
        });
    }
    async createOtpToken(memberId, channel, purpose) {
        const code = String(crypto.randomInt(100000, 999999));
        const codeHash = await bcrypt.hash(code, 10);
        const expiresMinutes = this.configService.get('app.otpExpiresMinutes', 15);
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
    async verifyOtpToken(memberId, code, purpose) {
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
            throw new common_1.BadRequestException('Verification code is invalid or expired');
        }
        if (token.attempts >= 5) {
            throw new common_1.BadRequestException('Too many failed attempts. Please request a new code.');
        }
        const match = await bcrypt.compare(code, token.codeHash);
        if (!match) {
            await this.prisma.verificationToken.update({
                where: { id: token.id },
                data: { attempts: { increment: 1 } },
            });
            throw new common_1.BadRequestException('Invalid verification code');
        }
        await this.prisma.verificationToken.update({
            where: { id: token.id },
            data: { consumedAt: new Date() },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map