import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class VerifiedMemberGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
