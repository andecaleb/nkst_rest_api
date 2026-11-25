import { createParamDecorator, ExecutionContext } from '@nestjs/common';
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

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    return data ? user?.[data] : user;
  },
);
