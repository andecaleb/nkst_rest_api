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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateNotificationPreferencesDto = exports.RegisterDeviceTokenDto = exports.CreateRecitationDto = exports.CreateOfficialAnnouncementDto = exports.HandleReportDto = exports.CreateReportDto = exports.SharePostDto = exports.ToggleReactionDto = exports.CreateCommentDto = exports.FilterFeedDto = exports.ModeratePostDto = exports.UpdatePostDto = exports.CreatePostDto = exports.PostMediaItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const pagination_util_1 = require("../../../common/utils/pagination.util");
class PostMediaItemDto {
    kind;
    fileUrl;
    fileName;
    mimeType;
    sizeBytes;
    position;
}
exports.PostMediaItemDto = PostMediaItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.MediaKind }),
    (0, class_validator_1.IsEnum)(client_1.MediaKind),
    __metadata("design:type", String)
], PostMediaItemDto.prototype, "kind", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PostMediaItemDto.prototype, "fileUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PostMediaItemDto.prototype, "fileName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PostMediaItemDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PostMediaItemDto.prototype, "sizeBytes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PostMediaItemDto.prototype, "position", void 0);
class CreatePostDto {
    type;
    category;
    audience;
    audienceGroupId;
    body;
    media;
    saveAsDraft;
}
exports.CreatePostDto = CreatePostDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.PostType, default: client_1.PostType.text }),
    (0, class_validator_1.IsEnum)(client_1.PostType),
    __metadata("design:type", String)
], CreatePostDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.PostCategory, default: client_1.PostCategory.general }),
    (0, class_validator_1.IsEnum)(client_1.PostCategory),
    __metadata("design:type", String)
], CreatePostDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.Audience, default: client_1.Audience.church }),
    (0, class_validator_1.IsEnum)(client_1.Audience),
    __metadata("design:type", String)
], CreatePostDto.prototype, "audience", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Required when audience is group' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePostDto.prototype, "audienceGroupId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Grace and peace to all brethren in Mkar!' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePostDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [PostMediaItemDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PostMediaItemDto),
    __metadata("design:type", Array)
], CreatePostDto.prototype, "media", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreatePostDto.prototype, "saveAsDraft", void 0);
class UpdatePostDto {
    body;
    category;
}
exports.UpdatePostDto = UpdatePostDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePostDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.PostCategory }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.PostCategory),
    __metadata("design:type", String)
], UpdatePostDto.prototype, "category", void 0);
class ModeratePostDto {
    action;
    reason;
}
exports.ModeratePostDto = ModeratePostDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.ModerationActionType }),
    (0, class_validator_1.IsEnum)(client_1.ModerationActionType),
    __metadata("design:type", String)
], ModeratePostDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Required for reject or request_correction' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ModeratePostDto.prototype, "reason", void 0);
class FilterFeedDto extends pagination_util_1.PaginationQueryDto {
    category;
    type;
    churchId;
    groupId;
}
exports.FilterFeedDto = FilterFeedDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.PostCategory }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.PostCategory),
    __metadata("design:type", String)
], FilterFeedDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.PostType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.PostType),
    __metadata("design:type", String)
], FilterFeedDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FilterFeedDto.prototype, "churchId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FilterFeedDto.prototype, "groupId", void 0);
class CreateCommentDto {
    body;
    parentCommentId;
}
exports.CreateCommentDto = CreateCommentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Amen! Thank you for sharing.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCommentDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Optional parent comment ID (1 level of replies supported — COM-02)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateCommentDto.prototype, "parentCommentId", void 0);
class ToggleReactionDto {
    subjectType;
    subjectId;
    kind;
}
exports.ToggleReactionDto = ToggleReactionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.ReactionSubjectType }),
    (0, class_validator_1.IsEnum)(client_1.ReactionSubjectType),
    __metadata("design:type", String)
], ToggleReactionDto.prototype, "subjectType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ToggleReactionDto.prototype, "subjectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.ReactionKind, example: client_1.ReactionKind.amen }),
    (0, class_validator_1.IsEnum)(client_1.ReactionKind),
    __metadata("design:type", String)
], ToggleReactionDto.prototype, "kind", void 0);
class SharePostDto {
    note;
}
exports.SharePostDto = SharePostDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Sharing this important notice with brethren.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SharePostDto.prototype, "note", void 0);
class CreateReportDto {
    subjectType;
    subjectId;
    reason;
    detail;
}
exports.CreateReportDto = CreateReportDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.ReportSubjectType }),
    (0, class_validator_1.IsEnum)(client_1.ReportSubjectType),
    __metadata("design:type", String)
], CreateReportDto.prototype, "subjectType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateReportDto.prototype, "subjectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.ReportReason }),
    (0, class_validator_1.IsEnum)(client_1.ReportReason),
    __metadata("design:type", String)
], CreateReportDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReportDto.prototype, "detail", void 0);
class HandleReportDto {
    decision;
    resolutionNote;
}
exports.HandleReportDto = HandleReportDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['dismiss', 'hide', 'remove'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], HandleReportDto.prototype, "decision", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HandleReportDto.prototype, "resolutionNote", void 0);
class CreateOfficialAnnouncementDto {
    type;
    category;
    audience;
    audienceChurchId;
    audienceGroupId;
    body;
    isPinned;
    pinDays;
    media;
}
exports.CreateOfficialAnnouncementDto = CreateOfficialAnnouncementDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.PostType, default: client_1.PostType.text }),
    (0, class_validator_1.IsEnum)(client_1.PostType),
    __metadata("design:type", String)
], CreateOfficialAnnouncementDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.PostCategory, default: client_1.PostCategory.announcement }),
    (0, class_validator_1.IsEnum)(client_1.PostCategory),
    __metadata("design:type", String)
], CreateOfficialAnnouncementDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.Audience, default: client_1.Audience.church }),
    (0, class_validator_1.IsEnum)(client_1.Audience),
    __metadata("design:type", String)
], CreateOfficialAnnouncementDto.prototype, "audience", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateOfficialAnnouncementDto.prototype, "audienceChurchId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateOfficialAnnouncementDto.prototype, "audienceGroupId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateOfficialAnnouncementDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateOfficialAnnouncementDto.prototype, "isPinned", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 7, maximum: 30 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(30),
    __metadata("design:type", Number)
], CreateOfficialAnnouncementDto.prototype, "pinDays", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [PostMediaItemDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PostMediaItemDto),
    __metadata("design:type", Array)
], CreateOfficialAnnouncementDto.prototype, "media", void 0);
class CreateRecitationDto {
    title;
    body;
    attachmentUrl;
    appliesOn;
}
exports.CreateRecitationDto = CreateRecitationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'NKST Sunday Recitation — Week 48' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRecitationDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'The Lord is my shepherd; I shall not want...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRecitationDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRecitationDto.prototype, "attachmentUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-11-29' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateRecitationDto.prototype, "appliesOn", void 0);
class RegisterDeviceTokenDto {
    platform;
    token;
}
exports.RegisterDeviceTokenDto = RegisterDeviceTokenDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.DevicePlatform }),
    (0, class_validator_1.IsEnum)(client_1.DevicePlatform),
    __metadata("design:type", String)
], RegisterDeviceTokenDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterDeviceTokenDto.prototype, "token", void 0);
class UpdateNotificationPreferencesDto {
    pushReactions;
    pushComments;
    pushAnnouncements;
}
exports.UpdateNotificationPreferencesDto = UpdateNotificationPreferencesDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "pushReactions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "pushComments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "pushAnnouncements", void 0);
//# sourceMappingURL=communication.dto.js.map