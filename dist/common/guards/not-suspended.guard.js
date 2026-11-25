"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotSuspendedGuard = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let NotSuspendedGuard = class NotSuspendedGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (user && user.verificationState === client_1.VerificationState.suspended) {
            throw new common_1.ForbiddenException('Your account is currently suspended and in read-only mode. You cannot perform this action.');
        }
        return true;
    }
};
exports.NotSuspendedGuard = NotSuspendedGuard;
exports.NotSuspendedGuard = NotSuspendedGuard = __decorate([
    (0, common_1.Injectable)()
], NotSuspendedGuard);
//# sourceMappingURL=not-suspended.guard.js.map