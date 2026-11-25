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
exports.InviteMemberDto = exports.DecideJoinRequestDto = exports.CreateGroupDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class CreateGroupDto {
    name;
    description;
    coverUrl;
    scope;
    churchId;
    visibility;
    joinMode;
    genderRestriction = client_1.GenderRestriction.any;
    minAge;
    maxAge;
    verifiedOnly = false;
    allowedChurchIds;
}
exports.CreateGroupDto = CreateGroupDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'NKST Mkar Youth Fellowship' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Fellowship and Bible study for young adults aged 18 to 35.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "coverUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.GroupScope, default: client_1.GroupScope.church }),
    (0, class_validator_1.IsEnum)(client_1.GroupScope),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "scope", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Church ID for church-scoped groups' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "churchId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.GroupVisibility, default: client_1.GroupVisibility.public }),
    (0, class_validator_1.IsEnum)(client_1.GroupVisibility),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "visibility", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.GroupJoinMode, default: client_1.GroupJoinMode.open }),
    (0, class_validator_1.IsEnum)(client_1.GroupJoinMode),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "joinMode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.GenderRestriction, default: client_1.GenderRestriction.any }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.GenderRestriction),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "genderRestriction", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 18 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(120),
    __metadata("design:type", Number)
], CreateGroupDto.prototype, "minAge", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 35 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(120),
    __metadata("design:type", Number)
], CreateGroupDto.prototype, "maxAge", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateGroupDto.prototype, "verifiedOnly", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], description: 'Optional list of allowed church UUIDs' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CreateGroupDto.prototype, "allowedChurchIds", void 0);
class DecideJoinRequestDto {
    decision;
    reason;
}
exports.DecideJoinRequestDto = DecideJoinRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['approve', 'reject'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DecideJoinRequestDto.prototype, "decision", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DecideJoinRequestDto.prototype, "reason", void 0);
class InviteMemberDto {
    memberId;
}
exports.InviteMemberDto = InviteMemberDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], InviteMemberDto.prototype, "memberId", void 0);
//# sourceMappingURL=groups.dto.js.map