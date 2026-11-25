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
exports.OrderMessageDto = exports.CancelOrderDto = exports.DeclineOrderDto = exports.CreateOrderDto = exports.HideListingDto = exports.RevokeSellerAccessDto = exports.GrantSellerAccessDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class GrantSellerAccessDto {
    memberId;
    plan;
}
exports.GrantSellerAccessDto = GrantSellerAccessDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Verified member UUID to approve as seller' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GrantSellerAccessDto.prototype, "memberId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.SellerPlan, example: client_1.SellerPlan.one_year }),
    (0, class_validator_1.IsEnum)(client_1.SellerPlan),
    __metadata("design:type", String)
], GrantSellerAccessDto.prototype, "plan", void 0);
class RevokeSellerAccessDto {
    reason;
}
exports.RevokeSellerAccessDto = RevokeSellerAccessDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Listing policy violation' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RevokeSellerAccessDto.prototype, "reason", void 0);
class HideListingDto {
    reason;
}
exports.HideListingDto = HideListingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Item description is misleading' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], HideListingDto.prototype, "reason", void 0);
class CreateOrderDto {
    resourceId;
    quantity = 1;
}
exports.CreateOrderDto = CreateOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Approved resource UUID (paid listing or free hard copy)' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "resourceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1, minimum: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "quantity", void 0);
class DeclineOrderDto {
    reason;
}
exports.DeclineOrderDto = DeclineOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Currently out of stock until next week' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DeclineOrderDto.prototype, "reason", void 0);
class CancelOrderDto {
    reason;
}
exports.CancelOrderDto = CancelOrderDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Buyer no longer needs the item' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CancelOrderDto.prototype, "reason", void 0);
class OrderMessageDto {
    body;
}
exports.OrderMessageDto = OrderMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Hello, can we arrange pickup after Sunday service at Mkar?' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], OrderMessageDto.prototype, "body", void 0);
//# sourceMappingURL=marketplace.dto.js.map