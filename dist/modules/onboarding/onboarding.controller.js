"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const onboarding_service_1 = require("./onboarding.service");
const verification_dto_1 = require("./dto/verification.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_constant_1 = require("../../common/constants/roles.constant");
const verified_member_guard_1 = require("../../common/guards/verified-member.guard");
const uuid_validation_pipe_1 = require("../../common/pipes/uuid-validation.pipe");
let OnboardingController = class OnboardingController {
    onboardingService;
    constructor(onboardingService) {
        this.onboardingService = onboardingService;
    }
    getMyStatus(user) {
        return this.onboardingService.getMyVerificationStatus(user);
    }
    submitRequest(user, dto) {
        return this.onboardingService.submitRequest(user, dto);
    }
    acknowledge(requestId, user, dto) {
        return this.onboardingService.acknowledgeRequest(requestId, user, dto);
    }
    getQueue(actor, churchId) {
        return this.onboardingService.getVerificationQueue(actor, churchId);
    }
    approve(requestId, actor, dto) {
        return this.onboardingService.approveRequest(requestId, actor, dto);
    }
    reject(requestId, actor, dto) {
        return this.onboardingService.rejectRequest(requestId, actor, dto);
    }
    directValidate(actor, dto) {
        return this.onboardingService.directValidate(actor, dto);
    }
};
exports.OnboardingController = OnboardingController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get own verification status, acknowledgement counter, and history (VER-01, VER-05, VER-06)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "getMyStatus", null);
__decorate([
    (0, common_1.Post)('requests'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a membership verification request via any of the 4 pathways (VER-01)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, verification_dto_1.SubmitVerificationRequestDto]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "submitRequest", null);
__decorate([
    (0, common_1.UseGuards)(verified_member_guard_1.VerifiedMemberGuard),
    (0, common_1.Post)('requests/:requestId/acknowledge'),
    (0, swagger_1.ApiOperation)({ summary: 'Acknowledge a member verification request (Pathway B — verified members only)' }),
    __param(0, (0, common_1.Param)('requestId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, verification_dto_1.AcknowledgeMemberDto]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "acknowledge", null);
__decorate([
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Get)('queue'),
    (0, swagger_1.ApiQuery)({ name: 'churchId', required: false }),
    (0, swagger_1.ApiOperation)({ summary: 'View verification review queue (VER-03)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('churchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "getQueue", null);
__decorate([
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Patch)('requests/:requestId/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a verification request and release held content (VER-07)' }),
    __param(0, (0, common_1.Param)('requestId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, verification_dto_1.ReviewVerificationDto]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "approve", null);
__decorate([
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Patch)('requests/:requestId/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a verification request with a mandatory reason (VER-04)' }),
    __param(0, (0, common_1.Param)('requestId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, verification_dto_1.RejectVerificationDto]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "reject", null);
__decorate([
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Post)('direct-validate'),
    (0, swagger_1.ApiOperation)({ summary: 'Directly validate a member via Church (Pathway C) or Platform (Pathway D) validation' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, verification_dto_1.DirectValidateMemberDto]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "directValidate", null);
exports.OnboardingController = OnboardingController = __decorate([
    (0, swagger_1.ApiTags)('04 — Membership Verification'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('verification'),
    __metadata("design:paramtypes", [onboarding_service_1.OnboardingService])
], OnboardingController);
//# sourceMappingURL=onboarding.controller.js.map