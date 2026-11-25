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
exports.DirectValidateMemberDto = exports.RejectVerificationDto = exports.ReviewVerificationDto = exports.AcknowledgeMemberDto = exports.SubmitVerificationRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class SubmitVerificationRequestDto {
    pathway;
    programme;
    completionDate;
    evidenceText;
    evidenceFileUrl;
}
exports.SubmitVerificationRequestDto = SubmitVerificationRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.VerificationPathway, example: client_1.VerificationPathway.catechism }),
    (0, class_validator_1.IsEnum)(client_1.VerificationPathway),
    __metadata("design:type", String)
], SubmitVerificationRequestDto.prototype, "pathway", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Adult Catechism Class 2024' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitVerificationRequestDto.prototype, "programme", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-08-15' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SubmitVerificationRequestDto.prototype, "completionDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Completed catechism at NKST Mkar' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitVerificationRequestDto.prototype, "evidenceText", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://cdn.nkst.org.ng/certs/cert-123.pdf' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitVerificationRequestDto.prototype, "evidenceFileUrl", void 0);
class AcknowledgeMemberDto {
    note;
}
exports.AcknowledgeMemberDto = AcknowledgeMemberDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'I personally know Terfa from NKST Gboko youth fellowship.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AcknowledgeMemberDto.prototype, "note", void 0);
class ReviewVerificationDto {
    decisionNote;
    completionDate;
}
exports.ReviewVerificationDto = ReviewVerificationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Confirmed with church catechism register' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewVerificationDto.prototype, "decisionNote", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-08-15' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ReviewVerificationDto.prototype, "completionDate", void 0);
class RejectVerificationDto {
    reason;
}
exports.RejectVerificationDto = RejectVerificationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Certificate photo is unreadable; please upload a clearer copy.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RejectVerificationDto.prototype, "reason", void 0);
class DirectValidateMemberDto {
    memberId;
    decisionNote;
}
exports.DirectValidateMemberDto = DirectValidateMemberDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Member UUID to validate directly (Pathway C or D)' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], DirectValidateMemberDto.prototype, "memberId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Known active member of the congregation' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DirectValidateMemberDto.prototype, "decisionNote", void 0);
//# sourceMappingURL=verification.dto.js.map