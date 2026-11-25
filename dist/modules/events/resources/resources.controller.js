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
exports.ResourcesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const resources_service_1 = require("./resources.service");
const resources_dto_1 = require("./resources.dto");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const roles_constant_1 = require("../../../common/constants/roles.constant");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const not_suspended_guard_1 = require("../../../common/guards/not-suspended.guard");
const uuid_validation_pipe_1 = require("../../../common/pipes/uuid-validation.pipe");
let ResourcesController = class ResourcesController {
    resourcesService;
    constructor(resourcesService) {
        this.resourcesService = resourcesService;
    }
    browseCentralLibrary(search, churchId, category, resourceType, access, format, ownerId, inStock, viewer) {
        return this.resourcesService.browseCentralLibrary({ search, churchId, category, resourceType, access, format, ownerId, inStock }, viewer);
    }
    getMyLibrary(user) {
        return this.resourcesService.getMyLibrary(user);
    }
    createResource(user, dto) {
        return this.resourcesService.createResource(user, dto);
    }
    updateResource(resourceId, user, dto) {
        return this.resourcesService.updateResource(resourceId, user, dto);
    }
    submitToChurch(resourceId, user) {
        return this.resourcesService.submitToChurch(resourceId, user);
    }
    archiveResource(resourceId, user) {
        return this.resourcesService.archiveResource(resourceId, user);
    }
    downloadFiles(resourceId, user) {
        return this.resourcesService.getResourceDownloadFiles(resourceId, user);
    }
    getReviewQueue(actor) {
        return this.resourcesService.getReviewQueue(actor);
    }
    reviewResource(resourceId, actor, dto) {
        return this.resourcesService.reviewResource(resourceId, actor, dto);
    }
};
exports.ResourcesController = ResourcesController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('library'),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'churchId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'category', enum: client_1.ResourceCategory, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'resourceType', enum: client_1.ResourceType, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'access', enum: client_1.ResourceAccess, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'format', enum: client_1.ResourceFormat, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'ownerId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'inStock', type: Boolean, required: false }),
    (0, swagger_1.ApiOperation)({ summary: 'Browse and search approved resources in the Central Library (RES-09, RES-10)' }),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('churchId')),
    __param(2, (0, common_1.Query)('category')),
    __param(3, (0, common_1.Query)('resourceType')),
    __param(4, (0, common_1.Query)('access')),
    __param(5, (0, common_1.Query)('format')),
    __param(6, (0, common_1.Query)('ownerId')),
    __param(7, (0, common_1.Query)('inStock')),
    __param(8, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, Boolean, Object]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "browseCentralLibrary", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('my-library'),
    (0, swagger_1.ApiOperation)({ summary: 'View personal library (My Library) with resource statuses (RES-01)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "getMyLibrary", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(not_suspended_guard_1.NotSuspendedGuard),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a resource (free/paid, digital/hard copy — RES-02, RES-03)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, resources_dto_1.CreateResourceDto]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "createResource", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(not_suspended_guard_1.NotSuspendedGuard),
    (0, common_1.Patch)(':resourceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Edit own resource; file/price edits trigger re-review (RES-14)' }),
    __param(0, (0, common_1.Param)('resourceId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, resources_dto_1.UpdateResourceDto]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "updateResource", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Patch)(':resourceId/submit'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a personal resource to the church collection (RES-04)' }),
    __param(0, (0, common_1.Param)('resourceId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "submitToChurch", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Patch)(':resourceId/archive'),
    (0, swagger_1.ApiOperation)({ summary: 'Archive/withdraw own resource from circulation (RES-07)' }),
    __param(0, (0, common_1.Param)('resourceId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "archiveResource", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)(':resourceId/download'),
    (0, swagger_1.ApiOperation)({ summary: 'Access digital resource files (free for verified; paid after order accepted — RES-11, RES-12)' }),
    __param(0, (0, common_1.Param)('resourceId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "downloadFiles", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Get)('review-queue'),
    (0, swagger_1.ApiOperation)({ summary: 'View church resource review queue (RES-05)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "getReviewQueue", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Patch)(':resourceId/review'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve or reject a submitted resource (Church Admin — RES-05)' }),
    __param(0, (0, common_1.Param)('resourceId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, resources_dto_1.ReviewResourceDto]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "reviewResource", null);
exports.ResourcesController = ResourcesController = __decorate([
    (0, swagger_1.ApiTags)('08 — Resources & Central Library'),
    (0, common_1.Controller)('resources'),
    __metadata("design:paramtypes", [resources_service_1.ResourcesService])
], ResourcesController);
//# sourceMappingURL=resources.controller.js.map