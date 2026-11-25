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
exports.IdentityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const identity_service_1 = require("./identity.service");
const church_dto_1 = require("./dto/church.dto");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_constant_1 = require("../../common/constants/roles.constant");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const uuid_validation_pipe_1 = require("../../common/pipes/uuid-validation.pipe");
let IdentityController = class IdentityController {
    identityService;
    constructor(identityService) {
        this.identityService = identityService;
    }
    getLocations() {
        return this.identityService.getNigerianLocations();
    }
    listChurches(query) {
        return this.identityService.listChurches(query);
    }
    getMapPins(state) {
        return this.identityService.getChurchMapPins(state);
    }
    getChurchDetail(churchId, viewer) {
        return this.identityService.getChurchDetail(churchId, viewer);
    }
    createChurch(dto, user) {
        return this.identityService.createChurch(dto, user.id);
    }
    updateChurch(churchId, dto, user) {
        return this.identityService.updateChurch(churchId, dto, user);
    }
    assignChurchAdmin(churchId, dto, user) {
        return this.identityService.assignChurchAdmin(churchId, dto, user.id);
    }
    deactivateChurch(churchId, user) {
        return this.identityService.deactivateChurch(churchId, user.id);
    }
};
exports.IdentityController = IdentityController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('locations'),
    (0, swagger_1.ApiOperation)({ summary: 'List Nigerian states and LGAs for registration and church directory' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IdentityController.prototype, "getLocations", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Browse and search NKST church directory (CHR-01)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [church_dto_1.FilterChurchesDto]),
    __metadata("design:returntype", void 0)
], IdentityController.prototype, "listChurches", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('map'),
    (0, swagger_1.ApiQuery)({ name: 'state', required: false }),
    (0, swagger_1.ApiOperation)({ summary: 'Get church geo-location pins for map view (CHR-08)' }),
    __param(0, (0, common_1.Query)('state')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IdentityController.prototype, "getMapPins", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':churchId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get church detail page with counts and previews (CHR-02)' }),
    __param(0, (0, common_1.Param)('churchId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], IdentityController.prototype, "getChurchDetail", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a church record (Platform Admin — CHR-03)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [church_dto_1.CreateChurchDto, Object]),
    __metadata("design:returntype", void 0)
], IdentityController.prototype, "createChurch", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Patch)(':churchId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update church details (CHR-03, CHR-09)' }),
    __param(0, (0, common_1.Param)('churchId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, church_dto_1.UpdateChurchDto, Object]),
    __metadata("design:returntype", void 0)
], IdentityController.prototype, "updateChurch", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Patch)(':churchId/admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign or replace sole Church Admin (Platform Admin — CHR-04)' }),
    __param(0, (0, common_1.Param)('churchId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, church_dto_1.AssignChurchAdminDto, Object]),
    __metadata("design:returntype", void 0)
], IdentityController.prototype, "assignChurchAdmin", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Patch)(':churchId/deactivate'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a church inactive; blocks new registrations (CHR-07)' }),
    __param(0, (0, common_1.Param)('churchId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], IdentityController.prototype, "deactivateChurch", null);
exports.IdentityController = IdentityController = __decorate([
    (0, swagger_1.ApiTags)('03 — Churches & Affiliation'),
    (0, common_1.Controller)('churches'),
    __metadata("design:paramtypes", [identity_service_1.IdentityService])
], IdentityController);
//# sourceMappingURL=identity.controller.js.map