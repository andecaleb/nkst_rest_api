import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto, RefreshTokenDto, RegisterDto, RequestOtpDto, ResetPasswordDto, VerifyAccountDto } from './dto/auth.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<{
        devOtp?: string | undefined;
        message: string;
        member: {
            id: string;
            firstName: string;
            middleName: string | null;
            surname: string;
            fullName: string;
            churchId: string;
            church: {
                id: string;
                name: string;
                state?: string;
                lga?: string;
            } | undefined;
            verificationState: import(".prisma/client").$Enums.VerificationState;
            isVerified: boolean;
            verificationBadge: string;
            profileVisibility: import(".prisma/client").$Enums.ProfileVisibility;
            photoUrl: string;
            bio: string | null;
            gender: string | undefined;
            state: string | undefined;
            lga: string | undefined;
        } | {
            email: string | undefined;
            phone: string | undefined;
            dateOfBirth: Date | undefined;
            residentialLocation: string | undefined;
            socialLinks: {
                id: string;
                label: string;
                url: string;
            }[] | undefined;
            isPlatformAdmin: boolean | undefined;
            suspensionReason: any;
            id: string;
            firstName: string;
            middleName: string | null;
            surname: string;
            fullName: string;
            churchId: string;
            church: {
                id: string;
                name: string;
                state?: string;
                lga?: string;
            } | undefined;
            verificationState: import(".prisma/client").$Enums.VerificationState;
            isVerified: boolean;
            verificationBadge: string;
            profileVisibility: import(".prisma/client").$Enums.ProfileVisibility;
            photoUrl: string;
            bio: string | null;
            gender: string | undefined;
            state: string | undefined;
            lga: string | undefined;
        } | null;
    }>;
    verifyAccount(dto: VerifyAccountDto): Promise<{
        verified: boolean;
        channel: import(".prisma/client").$Enums.TokenChannel;
        emailVerifiedAt: Date | null;
        phoneVerifiedAt: Date | null;
    }>;
    resendVerificationOtp(dto: RequestOtpDto): Promise<{
        devOtp?: string | undefined;
        message: string;
    }>;
    login(dto: LoginDto, ipAddress?: string): Promise<{
        reactivated: boolean;
        suspensionNotice: {
            suspended: boolean;
            readOnly: boolean;
            reason: string;
        } | null;
        member: {
            id: string;
            firstName: string;
            middleName: string | null;
            surname: string;
            fullName: string;
            churchId: string;
            church: {
                id: string;
                name: string;
                state?: string;
                lga?: string;
            } | undefined;
            verificationState: import(".prisma/client").$Enums.VerificationState;
            isVerified: boolean;
            verificationBadge: string;
            profileVisibility: import(".prisma/client").$Enums.ProfileVisibility;
            photoUrl: string;
            bio: string | null;
            gender: string | undefined;
            state: string | undefined;
            lga: string | undefined;
        } | {
            email: string | undefined;
            phone: string | undefined;
            dateOfBirth: Date | undefined;
            residentialLocation: string | undefined;
            socialLinks: {
                id: string;
                label: string;
                url: string;
            }[] | undefined;
            isPlatformAdmin: boolean | undefined;
            suspensionReason: any;
            id: string;
            firstName: string;
            middleName: string | null;
            surname: string;
            fullName: string;
            churchId: string;
            church: {
                id: string;
                name: string;
                state?: string;
                lga?: string;
            } | undefined;
            verificationState: import(".prisma/client").$Enums.VerificationState;
            isVerified: boolean;
            verificationBadge: string;
            profileVisibility: import(".prisma/client").$Enums.ProfileVisibility;
            photoUrl: string;
            bio: string | null;
            gender: string | undefined;
            state: string | undefined;
            lga: string | undefined;
        } | null;
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        sessionId: string;
    }>;
    refreshTokens(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
    }>;
    logout(memberId: string, sessionId?: string, deviceToken?: string): Promise<{
        signedOut: boolean;
    }>;
    logoutAll(memberId: string): Promise<{
        signedOutAllDevices: boolean;
    }>;
    requestPasswordReset(dto: RequestOtpDto): Promise<{
        devOtp?: string | undefined;
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    deactivateAccount(memberId: string): Promise<{
        deactivated: boolean;
        message: string;
    }>;
    listSessions(memberId: string): Promise<{
        deviceInfo: string | null;
        id: string;
        createdAt: Date;
        ipAddress: string | null;
        expiresAt: Date;
    }[]>;
    private issueSessionTokens;
    private findByIdentifier;
    private createOtpToken;
    private verifyOtpToken;
}
