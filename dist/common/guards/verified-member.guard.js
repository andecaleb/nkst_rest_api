"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifiedMemberGuard = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let VerifiedMemberGuard = class VerifiedMemberGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('Authentication required');
        }
        if (user.verificationState !== client_1.VerificationState.verified) {
            throw new common_1.ForbiddenException('This action requires a verified member account. Please complete membership verification first.');
        }
        return true;
    }
};
exports.VerifiedMemberGuard = VerifiedMemberGuard;
exports.VerifiedMemberGuard = VerifiedMemberGuard = __decorate([
    (0, common_1.Injectable)()
], VerifiedMemberGuard);
//# sourceMappingURL=verified-member.guard.js.map