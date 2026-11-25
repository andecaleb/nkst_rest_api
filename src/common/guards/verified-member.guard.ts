import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { VerificationState } from '@prisma/client';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Enforces that only verified members can perform verification-gated actions
 * (e.g. acknowledging other members, becoming a seller, ordering, reporting).
 */
@Injectable()
export class VerifiedMemberGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.verificationState !== VerificationState.verified) {
      throw new ForbiddenException(
        'This action requires a verified member account. Please complete membership verification first.',
      );
    }

    return true;
  }
}
