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
exports.RolesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const roles_service_1 = require("./roles.service");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_constant_1 = require("../../common/constants/roles.constant");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const uuid_validation_pipe_1 = require("../../common/pipes/uuid-validation.pipe");
class AssignRoleDto {
    roleName;
    churchId;
    groupId;
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'CHURCH_ADMIN' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignRoleDto.prototype, "roleName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignRoleDto.prototype, "churchId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignRoleDto.prototype, "groupId", void 0);
let RolesController = class RolesController {
    rolesService;
    constructor(rolesService) {
        this.rolesService = rolesService;
    }
    listRoles() {
        return this.rolesService.listRoles();
    }
    listPermissions() {
        return this.rolesService.listPermissions();
    }
    getMemberRoles(memberId) {
        return this.rolesService.getMemberRoles(memberId);
    }
    assignRole(memberId, dto, user) {
        return this.rolesService.assignRoleToMember(memberId, dto.roleName, user.id, {
            churchId: dto.churchId,
            groupId: dto.groupId,
        });
    }
    revokeRole(memberRoleId) {
        return this.rolesService.revokeRoleFromMember(memberRoleId);
    }
};
exports.RolesController = RolesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all functional roles and their permissions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "listRoles", null);
__decorate([
    (0, common_1.Get)('permissions'),
    (0, swagger_1.ApiOperation)({ summary: 'List all seeded permissions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "listPermissions", null);
__decorate([
    (0, common_1.Get)('member/:memberId'),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get role assignments for a member' }),
    __param(0, (0, common_1.Param)('memberId', uuid_validation_pipe_1.UuidValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "getMemberRoles", null);
__decorate([
    (0, common_1.Post)('member/:memberId'),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Assign a functional role to a member (Platform Admin)' }),
    __param(0, (0, common_1.Param)('memberId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AssignRoleDto, Object]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "assignRole", null);
__decorate([
    (0, common_1.Delete)('assignment/:memberRoleId'),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke a member role assignment (Platform Admin)' }),
    __param(0, (0, common_1.Param)('memberRoleId', uuid_validation_pipe_1.UuidValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "revokeRole", null);
exports.RolesController = RolesController = __decorate([
    (0, swagger_1.ApiTags)('01 — Roles & Permissions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('roles'),
    __metadata("design:paramtypes", [roles_service_1.RolesService])
], RolesController);
//# sourceMappingURL=roles.controller.js.map