import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { VerificationState } from '@prisma/client';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * AUTH-06: Suspended accounts can log in but are read-only and cannot create content.
 */
@Injectable()
export class NotSuspendedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (user && user.verificationState === VerificationState.suspended) {
      throw new ForbiddenException(
        'Your account is currently suspended and in read-only mode. You cannot perform this action.',
      );
    }

    return true;
  }
}
