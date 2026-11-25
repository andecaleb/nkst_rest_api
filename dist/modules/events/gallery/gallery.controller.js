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
exports.GalleryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const gallery_service_1 = require("./gallery.service");
const gallery_dto_1 = require("./gallery.dto");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const roles_constant_1 = require("../../../common/constants/roles.constant");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const not_suspended_guard_1 = require("../../../common/guards/not-suspended.guard");
const uuid_validation_pipe_1 = require("../../../common/pipes/uuid-validation.pipe");
let GalleryController = class GalleryController {
    galleryService;
    constructor(galleryService) {
        this.galleryService = galleryService;
    }
    listAlbums(churchId) {
        return this.galleryService.listAlbums(churchId);
    }
    createAlbum(churchId, actor, dto) {
        return this.galleryService.createAlbum(churchId, actor, dto);
    }
    listPhotos(churchId, category, albumId, eventName, uploaderId, viewer) {
        return this.galleryService.listPhotos({ churchId, category, albumId, eventName, uploaderId }, viewer);
    }
    uploadPhoto(user, dto) {
        return this.galleryService.uploadPhoto(user, dto);
    }
    getReviewQueue(actor) {
        return this.galleryService.getReviewQueue(actor);
    }
    reviewPhoto(photoId, actor, dto) {
        return this.galleryService.reviewPhoto(photoId, actor, dto);
    }
};
exports.GalleryController = GalleryController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('churches/:churchId/albums'),
    (0, swagger_1.ApiOperation)({ summary: 'List albums in a church gallery (GAL-01)' }),
    __param(0, (0, common_1.Param)('churchId', uuid_validation_pipe_1.UuidValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GalleryController.prototype, "listAlbums", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Post)('churches/:churchId/albums'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a gallery album (Church Admin — GAL-02)' }),
    __param(0, (0, common_1.Param)('churchId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, gallery_dto_1.CreateAlbumDto]),
    __metadata("design:returntype", void 0)
], GalleryController.prototype, "createAlbum", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('photos'),
    (0, swagger_1.ApiQuery)({ name: 'churchId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'category', enum: client_1.PhotoCategory, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'albumId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'eventName', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'uploaderId', required: false }),
    (0, swagger_1.ApiOperation)({ summary: 'Browse approved photos across all churches or one church (GAL-06, GAL-07)' }),
    __param(0, (0, common_1.Query)('churchId')),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('albumId')),
    __param(3, (0, common_1.Query)('eventName')),
    __param(4, (0, common_1.Query)('uploaderId')),
    __param(5, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object]),
    __metadata("design:returntype", void 0)
], GalleryController.prototype, "listPhotos", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(not_suspended_guard_1.NotSuspendedGuard),
    (0, common_1.Post)('photos'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload photo with consent & minors safeguarding flags (GAL-03, GAL-11, GAL-12)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, gallery_dto_1.UploadPhotoDto]),
    __metadata("design:returntype", void 0)
], GalleryController.prototype, "uploadPhoto", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Get)('review-queue'),
    (0, swagger_1.ApiOperation)({ summary: 'View photo review queue with minors safeguarding flag (GAL-04, GAL-12)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GalleryController.prototype, "getReviewQueue", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Patch)('photos/:photoId/review'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve, reject, or move a gallery photo (Church Admin — GAL-04)' }),
    __param(0, (0, common_1.Param)('photoId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, gallery_dto_1.ReviewPhotoDto]),
    __metadata("design:returntype", void 0)
], GalleryController.prototype, "reviewPhoto", null);
exports.GalleryController = GalleryController = __decorate([
    (0, swagger_1.ApiTags)('07 — Church Galleries'),
    (0, common_1.Controller)('gallery'),
    __metadata("design:paramtypes", [gallery_service_1.GalleryService])
], GalleryController);
//# sourceMappingURL=gallery.controller.js.map