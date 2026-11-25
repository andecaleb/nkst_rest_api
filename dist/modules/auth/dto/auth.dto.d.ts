import { Gender, TokenChannel } from '@prisma/client';
export declare class RegisterDto {
    firstName: string;
    middleName?: string;
    surname: string;
    email: string;
    phone: string;
    password: string;
    gender: Gender;
    dateOfBirth: string;
    state: string;
    lga: string;
    residentialLocation: string;
    churchId: string;
    photoUrl?: string;
    verificationChannel?: TokenChannel;
}
export declare class LoginDto {
    identifier: string;
    password: string;
    deviceInfo?: string;
}
export declare class VerifyAccountDto {
    identifier: string;
    code: string;
    channel: TokenChannel;
}
export declare class RequestOtpDto {
    identifier: string;
    channel: TokenChannel;
}
export declare class ResetPasswordDto {
    identifier: string;
    code: string;
    newPassword: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
