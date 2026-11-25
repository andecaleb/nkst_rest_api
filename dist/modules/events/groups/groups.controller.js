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
exports.GroupsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const groups_service_1 = require("./groups.service");
const groups_dto_1 = require("./groups.dto");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const roles_constant_1 = require("../../../common/constants/roles.constant");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const not_suspended_guard_1 = require("../../../common/guards/not-suspended.guard");
const uuid_validation_pipe_1 = require("../../../common/pipes/uuid-validation.pipe");
let GroupsController = class GroupsController {
    groupsService;
    constructor(groupsService) {
        this.groupsService = groupsService;
    }
    listGroups(search, churchId, scope, visibility) {
        return this.groupsService.listGroups({ search, churchId, scope, visibility });
    }
    createGroup(actor, dto) {
        return this.groupsService.createGroup(actor, dto);
    }
    joinGroup(groupId, user) {
        return this.groupsService.joinOrRequestGroup(groupId, user);
    }
    leaveGroup(groupId, user) {
        return this.groupsService.leaveGroup(groupId, user);
    }
    listMembers(groupId, viewer) {
        return this.groupsService.listGroupMembers(groupId, viewer);
    }
    listJoinRequests(groupId, actor) {
        return this.groupsService.listJoinRequests(groupId, actor);
    }
    decideJoinRequest(groupId, requestId, actor, dto) {
        return this.groupsService.decideJoinRequest(groupId, requestId, actor, dto);
    }
    inviteMember(groupId, actor, dto) {
        return this.groupsService.inviteMember(groupId, dto.memberId, actor);
    }
    promoteAdmin(groupId, memberId, actor) {
        return this.groupsService.promoteToGroupAdmin(groupId, memberId, actor);
    }
    removeMember(groupId, memberId, actor) {
        return this.groupsService.removeMember(groupId, memberId, actor);
    }
};
exports.GroupsController = GroupsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'churchId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'scope', enum: client_1.GroupScope, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'visibility', enum: client_1.GroupVisibility, required: false }),
    (0, swagger_1.ApiOperation)({ summary: 'Browse and filter groups (GRP-01)' }),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('churchId')),
    __param(2, (0, common_1.Query)('scope')),
    __param(3, (0, common_1.Query)('visibility')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "listGroups", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a church or national group with eligibility rules' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, groups_dto_1.CreateGroupDto]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "createGroup", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(not_suspended_guard_1.NotSuspendedGuard),
    (0, common_1.Post)(':groupId/join'),
    (0, swagger_1.ApiOperation)({ summary: 'Join an open group or request to join an approval group (GRP-02, GRP-03)' }),
    __param(0, (0, common_1.Param)('groupId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "joinGroup", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Delete)(':groupId/leave'),
    (0, swagger_1.ApiOperation)({ summary: 'Leave a group (GRP-07)' }),
    __param(0, (0, common_1.Param)('groupId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "leaveGroup", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':groupId/members'),
    (0, swagger_1.ApiOperation)({ summary: 'List group members respecting group and member privacy' }),
    __param(0, (0, common_1.Param)('groupId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "listMembers", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)(':groupId/requests'),
    (0, swagger_1.ApiOperation)({ summary: 'View pending join requests queue (Group Admin — GRP-04)' }),
    __param(0, (0, common_1.Param)('groupId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "listJoinRequests", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Patch)(':groupId/requests/:requestId'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve or reject a join request (Group Admin — GRP-04)' }),
    __param(0, (0, common_1.Param)('groupId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Param)('requestId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, groups_dto_1.DecideJoinRequestDto]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "decideJoinRequest", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)(':groupId/invite'),
    (0, swagger_1.ApiOperation)({ summary: 'Invite an eligible member to the group (Group Admin — GRP-05)' }),
    __param(0, (0, common_1.Param)('groupId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, groups_dto_1.InviteMemberDto]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "inviteMember", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Patch)(':groupId/members/:memberId/promote'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign another Group Admin (GRP-06)' }),
    __param(0, (0, common_1.Param)('groupId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Param)('memberId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "promoteAdmin", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Delete)(':groupId/members/:memberId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a member from the group (Group Admin — GRP-06)' }),
    __param(0, (0, common_1.Param)('groupId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Param)('memberId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "removeMember", null);
exports.GroupsController = GroupsController = __decorate([
    (0, swagger_1.ApiTags)('06 — Groups'),
    (0, common_1.Controller)('groups'),
    __metadata("design:paramtypes", [groups_service_1.GroupsService])
], GroupsController);
//# sourceMappingURL=groups.controller.js.map