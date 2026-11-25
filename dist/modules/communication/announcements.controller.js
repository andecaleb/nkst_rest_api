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
exports.AnnouncementsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const announcements_service_1 = require("./announcements.service");
const communication_dto_1 = require("./dto/communication.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_constant_1 = require("../../common/constants/roles.constant");
const uuid_validation_pipe_1 = require("../../common/pipes/uuid-validation.pipe");
let AnnouncementsController = class AnnouncementsController {
    announcementsService;
    constructor(announcementsService) {
        this.announcementsService = announcementsService;
    }
    listAnnouncements(category, churchId) {
        return this.announcementsService.listAnnouncements({ category, churchId });
    }
    publishAnnouncement(actor, dto) {
        return this.announcementsService.publishAnnouncement(actor, dto);
    }
    listRecitations(search) {
        return this.announcementsService.listPublishedRecitations(search);
    }
    createRecitation(actor, dto) {
        return this.announcementsService.createRecitation(actor, dto);
    }
    publishRecitation(recitationId) {
        return this.announcementsService.publishRecitation(recitationId);
    }
    unpublishRecitation(recitationId) {
        return this.announcementsService.unpublishRecitation(recitationId);
    }
    listNotifications(user) {
        return this.announcementsService.listNotifications(user);
    }
    markRead(user, notificationId) {
        return this.announcementsService.markNotificationRead(user, notificationId);
    }
    markAllRead(user) {
        return this.announcementsService.markAllNotificationsRead(user);
    }
    registerDeviceToken(user, dto) {
        return this.announcementsService.registerDeviceToken(user, dto);
    }
    updatePreferences(user, dto) {
        return this.announcementsService.updateNotificationPreferences(user, dto);
    }
};
exports.AnnouncementsController = AnnouncementsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('announcements'),
    (0, swagger_1.ApiQuery)({ name: 'category', enum: client_1.PostCategory, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'churchId', required: false }),
    (0, swagger_1.ApiOperation)({ summary: 'List official announcements (ANN-02)' }),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('churchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AnnouncementsController.prototype, "listAnnouncements", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.GROUP_ADMIN, roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Post)('announcements'),
    (0, swagger_1.ApiOperation)({ summary: 'Publish an official announcement skipping moderation (ANN-01..06)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, communication_dto_1.CreateOfficialAnnouncementDto]),
    __metadata("design:returntype", void 0)
], AnnouncementsController.prototype, "publishAnnouncement", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('recitations'),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiOperation)({ summary: 'List published national NKST recitations (REC-02, REC-03)' }),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnnouncementsController.prototype, "listRecitations", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Post)('recitations'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a draft recitation (Platform Admin — REC-01)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, communication_dto_1.CreateRecitationDto]),
    __metadata("design:returntype", void 0)
], AnnouncementsController.prototype, "createRecitation", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Patch)('recitations/:recitationId/publish'),
    (0, swagger_1.ApiOperation)({ summary: 'Publish a recitation and notify all members (REC-01, REC-05)' }),
    __param(0, (0, common_1.Param)('recitationId', uuid_validation_pipe_1.UuidValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnnouncementsController.prototype, "publishRecitation", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Patch)('recitations/:recitationId/unpublish'),
    (0, swagger_1.ApiOperation)({ summary: 'Unpublish a recitation (Platform Admin — REC-01)' }),
    __param(0, (0, common_1.Param)('recitationId', uuid_validation_pipe_1.UuidValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnnouncementsController.prototype, "unpublishRecitation", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('notifications'),
    (0, swagger_1.ApiOperation)({ summary: 'Get in-app notifications and unread count (NOT-01)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AnnouncementsController.prototype, "listNotifications", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Patch)('notifications/:notificationId/read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a notification as read' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('notificationId', uuid_validation_pipe_1.UuidValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AnnouncementsController.prototype, "markRead", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Patch)('notifications/read-all'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark all notifications as read' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AnnouncementsController.prototype, "markAllRead", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('notifications/device-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Register push notification device token on login (NOT-04)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, communication_dto_1.RegisterDeviceTokenDto]),
    __metadata("design:returntype", void 0)
], AnnouncementsController.prototype, "registerDeviceToken", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Patch)('notifications/preferences'),
    (0, swagger_1.ApiOperation)({ summary: 'Update push notification preferences (NOT-03)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, communication_dto_1.UpdateNotificationPreferencesDto]),
    __metadata("design:returntype", void 0)
], AnnouncementsController.prototype, "updatePreferences", null);
exports.AnnouncementsController = AnnouncementsController = __decorate([
    (0, swagger_1.ApiTags)('10 — Announcements, Recitations & Notifications'),
    (0, common_1.Controller)('communication'),
    __metadata("design:paramtypes", [announcements_service_1.AnnouncementsService])
], AnnouncementsController);
//# sourceMappingURL=announcements.controller.js.map