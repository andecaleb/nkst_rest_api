import { VerificationState } from '@prisma/client';
export interface AuthenticatedUser {
    id: string;
    email: string;
    phone: string;
    churchId: string;
    verificationState: VerificationState;
    isPlatformAdmin: boolean;
    administeredChurchIds: string[];
    roles: string[];
    sessionId?: string;
}
export declare const CurrentUser: (...dataOrPipes: (keyof AuthenticatedUser | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
