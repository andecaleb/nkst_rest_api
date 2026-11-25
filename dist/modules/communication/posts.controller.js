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
exports.PostsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const posts_service_1 = require("./posts.service");
const communication_dto_1 = require("./dto/communication.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_constant_1 = require("../../common/constants/roles.constant");
const not_suspended_guard_1 = require("../../common/guards/not-suspended.guard");
const verified_member_guard_1 = require("../../common/guards/verified-member.guard");
const uuid_validation_pipe_1 = require("../../common/pipes/uuid-validation.pipe");
let PostsController = class PostsController {
    postsService;
    constructor(postsService) {
        this.postsService = postsService;
    }
    getFeed(query, viewer) {
        return this.postsService.getHomeFeed(query, viewer);
    }
    createPost(user, dto) {
        return this.postsService.createPost(user, dto);
    }
    updatePost(postId, user, dto) {
        return this.postsService.updatePost(postId, user, dto);
    }
    deletePost(postId, user) {
        return this.postsService.softDeletePost(postId, user);
    }
    getModerationQueue(actor, query) {
        return this.postsService.getModerationQueue(actor, query);
    }
    moderatePost(postId, actor, dto) {
        return this.postsService.moderatePost(postId, actor, dto);
    }
    getModerationHistory(postId) {
        return this.postsService.getPostModerationHistory(postId);
    }
    listComments(postId, viewer) {
        return this.postsService.listComments(postId, viewer);
    }
    addComment(postId, user, dto) {
        return this.postsService.addComment(postId, user, dto);
    }
    toggleReaction(user, dto) {
        return this.postsService.toggleReaction(user, dto);
    }
    sharePost(postId, user, dto) {
        return this.postsService.sharePost(postId, user, dto);
    }
    createReport(user, dto) {
        return this.postsService.createReport(user, dto);
    }
    getReportsQueue(status) {
        return this.postsService.getReportsQueue(status);
    }
    handleReport(reportId, actor, dto) {
        return this.postsService.handleReport(reportId, actor, dto);
    }
};
exports.PostsController = PostsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('feed'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Home / Church / Group feed of approved posts' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [communication_dto_1.FilterFeedDto, Object]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "getFeed", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(not_suspended_guard_1.NotSuspendedGuard),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a post (held_unverified if unverified; pending_review if verified)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, communication_dto_1.CreatePostDto]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "createPost", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(not_suspended_guard_1.NotSuspendedGuard),
    (0, common_1.Patch)(':postId'),
    (0, swagger_1.ApiOperation)({ summary: 'Edit own post; editing an approved post triggers re-moderation (POST-07)' }),
    __param(0, (0, common_1.Param)('postId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, communication_dto_1.UpdatePostDto]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "updatePost", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Delete)(':postId'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete a post (retained for admin review)' }),
    __param(0, (0, common_1.Param)('postId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "deletePost", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.GROUP_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Get)('moderation/queue'),
    (0, swagger_1.ApiOperation)({ summary: 'View post moderation queue (POST-05)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, communication_dto_1.FilterFeedDto]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "getModerationQueue", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.GROUP_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Patch)(':postId/moderate'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve, reject, or request corrections on a post (POST-04, POST-06)' }),
    __param(0, (0, common_1.Param)('postId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, communication_dto_1.ModeratePostDto]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "moderatePost", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.GROUP_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Get)(':postId/moderation-history'),
    (0, swagger_1.ApiOperation)({ summary: 'View moderation history for a post (POST-06)' }),
    __param(0, (0, common_1.Param)('postId', uuid_validation_pipe_1.UuidValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "getModerationHistory", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':postId/comments'),
    (0, swagger_1.ApiOperation)({ summary: 'List visible comments and 1-level replies for a post' }),
    __param(0, (0, common_1.Param)('postId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "listComments", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(not_suspended_guard_1.NotSuspendedGuard),
    (0, common_1.Post)(':postId/comments'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a comment or reply to an approved post (COM-01..05)' }),
    __param(0, (0, common_1.Param)('postId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, communication_dto_1.CreateCommentDto]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "addComment", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(not_suspended_guard_1.NotSuspendedGuard, verified_member_guard_1.VerifiedMemberGuard),
    (0, common_1.Post)('reactions'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle or change reaction (Like, Amen, Love) on a post or comment (REA-01)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, communication_dto_1.ToggleReactionDto]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "toggleReaction", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(not_suspended_guard_1.NotSuspendedGuard),
    (0, common_1.Post)(':postId/share'),
    (0, swagger_1.ApiOperation)({ summary: 'Share an approved post within its audience limits (SHA-01)' }),
    __param(0, (0, common_1.Param)('postId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, communication_dto_1.SharePostDto]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "sharePost", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(verified_member_guard_1.VerifiedMemberGuard),
    (0, common_1.Post)('reports'),
    (0, swagger_1.ApiOperation)({ summary: 'Report a post, comment, or photo (REP-01, GAL-14)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, communication_dto_1.CreateReportDto]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "createReport", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.GROUP_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Get)('reports/queue'),
    (0, swagger_1.ApiQuery)({ name: 'status', enum: client_1.ReportStatus, required: false }),
    (0, swagger_1.ApiOperation)({ summary: 'View content reports queue (REP-02)' }),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "getReportsQueue", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.GROUP_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Patch)('reports/:reportId'),
    (0, swagger_1.ApiOperation)({ summary: 'Dismiss, hide, or remove reported content (REP-02, REP-03)' }),
    __param(0, (0, common_1.Param)('reportId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, communication_dto_1.HandleReportDto]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "handleReport", null);
exports.PostsController = PostsController = __decorate([
    (0, swagger_1.ApiTags)('05 — Posts, Comments & Moderation'),
    (0, common_1.Controller)('posts'),
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], PostsController);
//# sourceMappingURL=posts.controller.js.map