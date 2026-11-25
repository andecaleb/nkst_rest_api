import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, RegisterDto, RequestOtpDto, ResetPasswordDto, VerifyAccountDto } from './dto/auth.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    resendOtp(dto: RequestOtpDto): Promise<{
        devOtp?: string | undefined;
        message: string;
    }>;
    login(dto: LoginDto, req: Request): Promise<{
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
    refresh(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
    }>;
    requestPasswordReset(dto: RequestOtpDto): Promise<{
        devOtp?: string | undefined;
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    listSessions(user: AuthenticatedUser): Promise<{
        deviceInfo: string | null;
        id: string;
        createdAt: Date;
        ipAddress: string | null;
        expiresAt: Date;
    }[]>;
    logout(user: AuthenticatedUser, deviceToken?: string): Promise<{
        signedOut: boolean;
    }>;
    logoutAll(user: AuthenticatedUser): Promise<{
        signedOutAllDevices: boolean;
    }>;
    deactivate(user: AuthenticatedUser): Promise<{
        deactivated: boolean;
        message: string;
    }>;
}
