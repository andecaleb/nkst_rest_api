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
exports.SuspendMemberDto = exports.SocialLinkDto = exports.ChangeChurchDto = exports.TogglePrivacyDto = exports.UpdateProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class UpdateProfileDto {
    firstName;
    middleName;
    surname;
    bio;
    photoUrl;
    gender;
    dateOfBirth;
    state;
    lga;
    residentialLocation;
}
exports.UpdateProfileDto = UpdateProfileDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "middleName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "surname", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "photoUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.Gender }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Gender),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "dateOfBirth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "lga", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "residentialLocation", void 0);
class TogglePrivacyDto {
    profileVisibility;
}
exports.TogglePrivacyDto = TogglePrivacyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.ProfileVisibility, example: client_1.ProfileVisibility.private }),
    (0, class_validator_1.IsEnum)(client_1.ProfileVisibility),
    __metadata("design:type", String)
], TogglePrivacyDto.prototype, "profileVisibility", void 0);
class ChangeChurchDto {
    churchId;
}
exports.ChangeChurchDto = ChangeChurchDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'New active church UUID (PRO-05)' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ChangeChurchDto.prototype, "churchId", void 0);
class SocialLinkDto {
    label;
    url;
}
exports.SocialLinkDto = SocialLinkDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'LinkedIn' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SocialLinkDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://linkedin.com/in/terfa-tarka' }),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], SocialLinkDto.prototype, "url", void 0);
class SuspendMemberDto {
    reason;
}
exports.SuspendMemberDto = SuspendMemberDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Repeated violation of community posting guidelines' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SuspendMemberDto.prototype, "reason", void 0);
//# sourceMappingURL=member.dto.js.map