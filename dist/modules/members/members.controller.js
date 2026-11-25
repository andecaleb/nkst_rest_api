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
exports.MembersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const members_service_1 = require("./members.service");
const member_dto_1 = require("./dto/member.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_constant_1 = require("../../common/constants/roles.constant");
const uuid_validation_pipe_1 = require("../../common/pipes/uuid-validation.pipe");
let MembersController = class MembersController {
    membersService;
    constructor(membersService) {
        this.membersService = membersService;
    }
    getMe(user) {
        return this.membersService.getMyProfile(user);
    }
    updateMe(user, dto) {
        return this.membersService.updateMyProfile(user, dto);
    }
    togglePrivacy(user, dto) {
        return this.membersService.togglePrivacy(user, dto);
    }
    changeChurch(user, dto) {
        return this.membersService.changeChurch(user, dto);
    }
    addSocialLink(user, dto) {
        return this.membersService.addSocialLink(user, dto);
    }
    deleteSocialLink(user, linkId) {
        return this.membersService.deleteSocialLink(user, linkId);
    }
    getMemberProfile(memberId, viewer) {
        return this.membersService.getMemberProfile(memberId, viewer);
    }
    suspendMember(memberId, dto, user) {
        return this.membersService.suspendMember(memberId, dto, user);
    }
    reinstateMember(memberId, user) {
        return this.membersService.reinstateMember(memberId, user);
    }
};
exports.MembersController = MembersController;
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get authenticated member profile (PRO-01)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "getMe", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Patch)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Update own profile; re-checks group eligibility (PRO-01, GRP-09)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, member_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "updateMe", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Patch)('me/privacy'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle public/private profile visibility (PRIV-01, PRIV-02)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, member_dto_1.TogglePrivacyDto]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "togglePrivacy", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Patch)('me/church'),
    (0, swagger_1.ApiOperation)({ summary: 'Change church affiliation; resets church-level verification (PRO-05)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, member_dto_1.ChangeChurchDto]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "changeChurch", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('me/social-links'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a social link to own profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, member_dto_1.SocialLinkDto]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "addSocialLink", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Delete)('me/social-links/:linkId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a social link from own profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('linkId', uuid_validation_pipe_1.UuidValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "deleteSocialLink", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':memberId'),
    (0, swagger_1.ApiOperation)({ summary: 'View member profile respecting privacy masking (PRO-01..04, PRIV-03)' }),
    __param(0, (0, common_1.Param)('memberId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "getMemberProfile", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Patch)(':memberId/suspend'),
    (0, swagger_1.ApiOperation)({ summary: 'Suspend a member with a reason (VER-08)' }),
    __param(0, (0, common_1.Param)('memberId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, member_dto_1.SuspendMemberDto, Object]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "suspendMember", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Patch)(':memberId/reinstate'),
    (0, swagger_1.ApiOperation)({ summary: 'Reinstate a suspended member (VER-08)' }),
    __param(0, (0, common_1.Param)('memberId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "reinstateMember", null);
exports.MembersController = MembersController = __decorate([
    (0, swagger_1.ApiTags)('02 — Members & Profiles'),
    (0, common_1.Controller)('members'),
    __metadata("design:paramtypes", [members_service_1.MembersService])
], MembersController);
//# sourceMappingURL=members.controller.js.map