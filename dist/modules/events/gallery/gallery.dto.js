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
exports.ReviewPhotoDto = exports.UploadPhotoDto = exports.CreateAlbumDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class CreateAlbumDto {
    title;
    description;
    eventName;
    eventDate;
}
exports.CreateAlbumDto = CreateAlbumDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026 Annual Synod Thanksgiving' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAlbumDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAlbumDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAlbumDto.prototype, "eventName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAlbumDto.prototype, "eventDate", void 0);
class UploadPhotoDto {
    fileUrl;
    caption;
    category;
    albumId;
    eventName;
    consentConfirmed;
    hasMinors;
    parentalConsentConfirmed;
}
exports.UploadPhotoDto = UploadPhotoDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UploadPhotoDto.prototype, "fileUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadPhotoDto.prototype, "caption", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.PhotoCategory, default: client_1.PhotoCategory.worship_service }),
    (0, class_validator_1.IsEnum)(client_1.PhotoCategory),
    __metadata("design:type", String)
], UploadPhotoDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UploadPhotoDto.prototype, "albumId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadPhotoDto.prototype, "eventName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'GAL-11: Uploader must confirm right to share and consent of pictured people',
        example: true,
    }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UploadPhotoDto.prototype, "consentConfirmed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'GAL-12: Marks whether photo shows children/minors (always requires admin review)',
        default: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UploadPhotoDto.prototype, "hasMinors", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UploadPhotoDto.prototype, "parentalConsentConfirmed", void 0);
class ReviewPhotoDto {
    decision;
    reason;
    moveToAlbumId;
}
exports.ReviewPhotoDto = ReviewPhotoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['approve', 'reject'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ReviewPhotoDto.prototype, "decision", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewPhotoDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Optional album UUID to move photo into (GAL-04)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReviewPhotoDto.prototype, "moveToAlbumId", void 0);
//# sourceMappingURL=gallery.dto.js.map