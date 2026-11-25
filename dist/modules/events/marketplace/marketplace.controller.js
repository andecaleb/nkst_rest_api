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
exports.MarketplaceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const marketplace_service_1 = require("./marketplace.service");
const marketplace_dto_1 = require("./marketplace.dto");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const roles_constant_1 = require("../../../common/constants/roles.constant");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const not_suspended_guard_1 = require("../../../common/guards/not-suspended.guard");
const verified_member_guard_1 = require("../../../common/guards/verified-member.guard");
const uuid_validation_pipe_1 = require("../../../common/pipes/uuid-validation.pipe");
let MarketplaceController = class MarketplaceController {
    marketplaceService;
    constructor(marketplaceService) {
        this.marketplaceService = marketplaceService;
    }
    listListings(churchId, category, format, minPrice, maxPrice, sellerId, viewer) {
        return this.marketplaceService.listMarketplaceListings({ churchId, category, format, minPrice, maxPrice, sellerId }, viewer);
    }
    grantSellerAccess(actor, dto) {
        return this.marketplaceService.grantSellerAccess(actor, dto);
    }
    revokeSeller(sellerAccessId, actor, dto) {
        return this.marketplaceService.revokeSellerAccess(sellerAccessId, actor, dto);
    }
    togglePause(resourceId, user, paused) {
        return this.marketplaceService.togglePauseListing(resourceId, user, Boolean(paused));
    }
    hideListing(resourceId, actor, dto) {
        return this.marketplaceService.hideListing(resourceId, actor, dto);
    }
    createOrder(user, dto) {
        return this.marketplaceService.createOrder(user, dto);
    }
    getMyOrders(user) {
        return this.marketplaceService.getMyOrders(user);
    }
    getMySales(user) {
        return this.marketplaceService.getMySales(user);
    }
    getFulfilmentPool(actor) {
        return this.marketplaceService.getFulfilmentPool(actor);
    }
    acceptOrder(orderId, seller) {
        return this.marketplaceService.acceptOrder(orderId, seller);
    }
    declineOrder(orderId, seller, dto) {
        return this.marketplaceService.declineOrder(orderId, seller, dto);
    }
    confirmReceipt(orderId, buyer) {
        return this.marketplaceService.confirmReceipt(orderId, buyer);
    }
    closeOrder(orderId, actor) {
        return this.marketplaceService.closeOrder(orderId, actor);
    }
    cancelOrder(orderId, actor, dto) {
        return this.marketplaceService.cancelOrder(orderId, actor, dto);
    }
    listOrderMessages(orderId, user) {
        return this.marketplaceService.listOrderMessages(orderId, user);
    }
    postOrderMessage(orderId, user, dto) {
        return this.marketplaceService.postOrderMessage(orderId, user, dto);
    }
};
exports.MarketplaceController = MarketplaceController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('listings'),
    (0, swagger_1.ApiQuery)({ name: 'churchId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'category', enum: client_1.ResourceCategory, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'format', enum: client_1.ResourceFormat, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'minPrice', type: Number, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'maxPrice', type: Number, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'sellerId', required: false }),
    (0, swagger_1.ApiOperation)({ summary: 'Browse active church marketplace listings (MKT-01..06)' }),
    __param(0, (0, common_1.Query)('churchId')),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('format')),
    __param(3, (0, common_1.Query)('minPrice')),
    __param(4, (0, common_1.Query)('maxPrice')),
    __param(5, (0, common_1.Query)('sellerId')),
    __param(6, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number, String, Object]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "listListings", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Post)('sellers/grant'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a verified member as seller and grant access period (no payment)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, marketplace_dto_1.GrantSellerAccessDto]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "grantSellerAccess", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Patch)('sellers/:sellerAccessId/revoke'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke seller access with a reason (MKT-05)' }),
    __param(0, (0, common_1.Param)('sellerAccessId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, marketplace_dto_1.RevokeSellerAccessDto]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "revokeSeller", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Patch)('listings/:resourceId/pause'),
    (0, swagger_1.ApiOperation)({ summary: 'Pause or resume own marketplace listing (MKT-04)' }),
    __param(0, (0, common_1.Param)('resourceId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)('paused')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Boolean]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "togglePause", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Patch)('listings/:resourceId/hide'),
    (0, swagger_1.ApiOperation)({ summary: 'Hide a listing with a reason (Church Admin — MKT-05)' }),
    __param(0, (0, common_1.Param)('resourceId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, marketplace_dto_1.HideListingDto]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "hideListing", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(not_suspended_guard_1.NotSuspendedGuard, verified_member_guard_1.VerifiedMemberGuard),
    (0, common_1.Post)('orders'),
    (0, swagger_1.ApiOperation)({ summary: 'Request a marketplace listing or free hard copy (ORD-01, payment_status=not_enabled)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, marketplace_dto_1.CreateOrderDto]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "createOrder", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('orders/my-orders'),
    (0, swagger_1.ApiOperation)({ summary: 'List My Orders as buyer (ORD-12)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "getMyOrders", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('orders/my-sales'),
    (0, swagger_1.ApiOperation)({ summary: 'List My Sales as seller (ORD-12)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "getMySales", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('fulfilment-pool'),
    (0, swagger_1.ApiOperation)({ summary: 'View hard-copy fulfilment pool with waiting times (ORD-06, ORD-11)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "getFulfilmentPool", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Patch)('orders/:orderId/accept'),
    (0, swagger_1.ApiOperation)({ summary: 'Seller accepts order (digital -> fulfilled; hard copy -> awaiting_delivery)' }),
    __param(0, (0, common_1.Param)('orderId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "acceptOrder", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Patch)('orders/:orderId/decline'),
    (0, swagger_1.ApiOperation)({ summary: 'Seller declines order with reason (ORD-02)' }),
    __param(0, (0, common_1.Param)('orderId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, marketplace_dto_1.DeclineOrderDto]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "declineOrder", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Patch)('orders/:orderId/confirm-receipt'),
    (0, swagger_1.ApiOperation)({ summary: 'Buyer confirms receipt of hard-copy item; notifies Church Admin (ORD-08)' }),
    __param(0, (0, common_1.Param)('orderId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "confirmReceipt", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.ROLES.CHURCH_ADMIN, roles_constant_1.ROLES.PLATFORM_ADMIN),
    (0, common_1.Patch)('orders/:orderId/close'),
    (0, swagger_1.ApiOperation)({ summary: 'Church Admin acknowledges receipt and closes order (ORD-09)' }),
    __param(0, (0, common_1.Param)('orderId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "closeOrder", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Patch)('orders/:orderId/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel order (buyer before acceptance; Church Admin after acceptance — ORD-10)' }),
    __param(0, (0, common_1.Param)('orderId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, marketplace_dto_1.CancelOrderDto]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "cancelOrder", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('orders/:orderId/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'List order messages between buyer and seller (ORD-03)' }),
    __param(0, (0, common_1.Param)('orderId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "listOrderMessages", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('orders/:orderId/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a message in an order thread (ORD-03)' }),
    __param(0, (0, common_1.Param)('orderId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, marketplace_dto_1.OrderMessageDto]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "postOrderMessage", null);
exports.MarketplaceController = MarketplaceController = __decorate([
    (0, swagger_1.ApiTags)('09 — Marketplace (No Financials)'),
    (0, common_1.Controller)('marketplace'),
    __metadata("design:paramtypes", [marketplace_service_1.MarketplaceService])
], MarketplaceController);
//# sourceMappingURL=marketplace.controller.js.map