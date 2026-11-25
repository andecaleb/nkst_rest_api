import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class NotSuspendedGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
