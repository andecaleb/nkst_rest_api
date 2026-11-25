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
exports.MarketplaceService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../database/prisma.service");
const privacy_util_1 = require("../../../common/utils/privacy.util");
let MarketplaceService = class MarketplaceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async grantSellerAccess(actor, dto) {
        const member = await this.prisma.member.findFirst({
            where: { id: dto.memberId, deletedAt: null },
        });
        if (!member)
            throw new common_1.NotFoundException('Member not found');
        if (member.verificationState !== client_1.VerificationState.verified) {
            throw new common_1.BadRequestException('Only verified members can be approved as sellers');
        }
        if (!actor.isPlatformAdmin && !actor.administeredChurchIds.includes(member.churchId)) {
            throw new common_1.ForbiddenException('You can only approve sellers in your own church');
        }
        const startsAt = new Date();
        const endsAt = this.computePlanEndDate(startsAt, dto.plan);
        const access = await this.prisma.sellerAccess.create({
            data: {
                memberId: member.id,
                churchId: member.churchId,
                approvedById: actor.id,
                plan: dto.plan,
                startsAt,
                endsAt,
                status: client_1.SellerAccessStatus.active,
                tokenReference: null,
            },
        });
        await this.prisma.notification.create({
            data: {
                memberId: member.id,
                type: 'seller_approved',
                subjectType: 'seller_access',
                subjectId: access.id,
                title: 'Marketplace Seller Access Granted',
                body: `Your seller access (${dto.plan}) is now active.`,
            },
        });
        return access;
    }
    async revokeSellerAccess(sellerAccessId, actor, dto) {
        const access = await this.prisma.sellerAccess.findUnique({ where: { id: sellerAccessId } });
        if (!access)
            throw new common_1.NotFoundException('Seller access record not found');
        if (!actor.isPlatformAdmin && !actor.administeredChurchIds.includes(access.churchId)) {
            throw new common_1.ForbiddenException('Not authorized to revoke this seller access');
        }
        return this.prisma.sellerAccess.update({
            where: { id: sellerAccessId },
            data: { status: client_1.SellerAccessStatus.revoked, revokeReason: dto.reason },
        });
    }
    async listMarketplaceListings(filters, viewer) {
        const now = new Date();
        const activeSellers = await this.prisma.sellerAccess.findMany({
            where: {
                status: client_1.SellerAccessStatus.active,
                OR: [{ endsAt: null }, { endsAt: { gt: now } }],
                ...(filters.churchId ? { churchId: filters.churchId } : {}),
                ...(filters.sellerId ? { memberId: filters.sellerId } : {}),
            },
            select: { memberId: true, churchId: true },
        });
        const eligibleSellerIds = Array.from(new Set(activeSellers.map((s) => s.memberId)));
        if (eligibleSellerIds.length === 0)
            return [];
        const listings = await this.prisma.resource.findMany({
            where: {
                access: client_1.ResourceAccess.paid,
                status: client_1.ResourceStatus.approved,
                isListingPaused: false,
                isHiddenByAdmin: false,
                deletedAt: null,
                ownerId: { in: eligibleSellerIds },
                ...(filters.churchId ? { churchId: filters.churchId } : {}),
                ...(filters.category ? { category: filters.category } : {}),
                ...(filters.format ? { format: filters.format } : {}),
                ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
                    ? {
                        price: {
                            ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
                            ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
                        },
                    }
                    : {}),
            },
            include: {
                owner: { include: { church: { select: { id: true, name: true } } } },
                church: { select: { id: true, name: true } },
                files: { where: { isPreviewImage: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return listings.map((item) => ({
            ...item,
            outOfStock: item.format === client_1.ResourceFormat.hard_copy && (item.stock ?? 0) <= 0,
            seller: (0, privacy_util_1.serializeMemberCard)(item.owner, viewer),
            owner: undefined,
        }));
    }
    async togglePauseListing(resourceId, user, paused) {
        const resource = await this.prisma.resource.findFirst({
            where: { id: resourceId, ownerId: user.id, deletedAt: null },
        });
        if (!resource)
            throw new common_1.NotFoundException('Listing not found');
        return this.prisma.resource.update({
            where: { id: resourceId },
            data: { isListingPaused: paused },
        });
    }
    async hideListing(resourceId, actor, dto) {
        const resource = await this.prisma.resource.findFirst({
            where: { id: resourceId, deletedAt: null },
        });
        if (!resource)
            throw new common_1.NotFoundException('Listing not found');
        if (!actor.isPlatformAdmin && !actor.administeredChurchIds.includes(resource.churchId)) {
            throw new common_1.ForbiddenException('Only the Church Admin can hide listings in this church');
        }
        return this.prisma.resource.update({
            where: { id: resourceId },
            data: { isHiddenByAdmin: true, hiddenReason: dto.reason },
        });
    }
    async createOrder(user, dto) {
        const resource = await this.prisma.resource.findFirst({
            where: { id: dto.resourceId, status: client_1.ResourceStatus.approved, deletedAt: null },
        });
        if (!resource)
            throw new common_1.NotFoundException('Approved resource/listing not found');
        if (resource.ownerId === user.id) {
            throw new common_1.BadRequestException('You cannot request your own listing (ORD-01)');
        }
        if (resource.access === client_1.ResourceAccess.paid) {
            const activeSeller = await this.prisma.sellerAccess.findFirst({
                where: {
                    memberId: resource.ownerId,
                    churchId: resource.churchId,
                    status: client_1.SellerAccessStatus.active,
                    OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
                },
            });
            if (!activeSeller || resource.isListingPaused || resource.isHiddenByAdmin) {
                throw new common_1.BadRequestException('This listing is not currently available');
            }
        }
        else if (resource.format !== client_1.ResourceFormat.hard_copy) {
            throw new common_1.BadRequestException('Free digital resources can be downloaded directly without an order');
        }
        const quantity = dto.quantity ?? 1;
        if (resource.format === client_1.ResourceFormat.hard_copy && (resource.stock ?? 0) < quantity) {
            throw new common_1.BadRequestException('Insufficient stock available');
        }
        const order = await this.prisma.order.create({
            data: {
                resourceId: resource.id,
                buyerId: user.id,
                sellerId: resource.ownerId,
                churchId: resource.churchId,
                quantity,
                status: client_1.OrderStatus.requested,
                paymentStatus: 'not_enabled',
            },
            include: { resource: true },
        });
        await this.prisma.notification.create({
            data: {
                memberId: resource.ownerId,
                type: 'order_requested',
                subjectType: 'order',
                subjectId: order.id,
                title: 'New Marketplace Request',
                body: `A member requested "${resource.title}" (Qty: ${quantity}).`,
            },
        });
        return order;
    }
    async acceptOrder(orderId, seller) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { resource: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.sellerId !== seller.id) {
            throw new common_1.ForbiddenException('Only the seller can accept this order');
        }
        if (order.status !== client_1.OrderStatus.requested) {
            throw new common_1.BadRequestException(`Cannot accept order in status "${order.status}"`);
        }
        const isDigital = order.resource.format === client_1.ResourceFormat.digital;
        const nextStatus = isDigital ? client_1.OrderStatus.fulfilled : client_1.OrderStatus.awaiting_delivery;
        return this.prisma.$transaction(async (tx) => {
            if (!isDigital) {
                if ((order.resource.stock ?? 0) < order.quantity) {
                    throw new common_1.BadRequestException('Insufficient stock to accept this hard-copy order');
                }
                await tx.resource.update({
                    where: { id: order.resourceId },
                    data: { stock: { decrement: order.quantity } },
                });
            }
            const updated = await tx.order.update({
                where: { id: orderId },
                data: { status: nextStatus, acceptedAt: new Date() },
            });
            await tx.notification.create({
                data: {
                    memberId: order.buyerId,
                    type: 'order_accepted',
                    subjectType: 'order',
                    subjectId: orderId,
                    title: 'Order Accepted',
                    body: isDigital
                        ? `Your request for "${order.resource.title}" was accepted. You can now download the file.`
                        : `Your request for "${order.resource.title}" was accepted and is awaiting delivery.`,
                },
            });
            return updated;
        });
    }
    async declineOrder(orderId, seller, dto) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.sellerId !== seller.id) {
            throw new common_1.ForbiddenException('Only the seller can decline this order');
        }
        if (order.status !== client_1.OrderStatus.requested) {
            throw new common_1.BadRequestException('Only requested orders can be declined');
        }
        const updated = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: client_1.OrderStatus.declined, declineReason: dto.reason },
        });
        await this.prisma.notification.create({
            data: {
                memberId: order.buyerId,
                type: 'order_declined',
                subjectType: 'order',
                subjectId: orderId,
                title: 'Order Declined',
                body: `Your request was declined. Reason: ${dto.reason}`,
            },
        });
        return updated;
    }
    async confirmReceipt(orderId, buyer) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { church: true, resource: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.buyerId !== buyer.id) {
            throw new common_1.ForbiddenException('Only the buyer can confirm receipt');
        }
        if (order.status !== client_1.OrderStatus.awaiting_delivery) {
            throw new common_1.BadRequestException('Order must be awaiting delivery to confirm receipt');
        }
        const updated = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: client_1.OrderStatus.received, receivedAt: new Date() },
        });
        if (order.church.adminMemberId) {
            await this.prisma.notification.create({
                data: {
                    memberId: order.church.adminMemberId,
                    type: 'hard_copy_received',
                    subjectType: 'order',
                    subjectId: orderId,
                    title: 'Hard-Copy Receipt Confirmed',
                    body: `Buyer confirmed receipt of "${order.resource.title}" (Qty: ${order.quantity}). Ready to close.`,
                },
            });
        }
        return updated;
    }
    async closeOrder(orderId, actor) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (!actor.isPlatformAdmin && !actor.administeredChurchIds.includes(order.churchId)) {
            throw new common_1.ForbiddenException('Only the Church Admin can close received orders');
        }
        if (order.status !== client_1.OrderStatus.received) {
            throw new common_1.BadRequestException('Only received orders can be closed');
        }
        return this.prisma.order.update({
            where: { id: orderId },
            data: { status: client_1.OrderStatus.closed, closedById: actor.id, closedAt: new Date() },
        });
    }
    async cancelOrder(orderId, actor, dto) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { resource: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const isChurchAdmin = actor.isPlatformAdmin || actor.administeredChurchIds.includes(order.churchId);
        if (order.status === client_1.OrderStatus.requested) {
            if (order.buyerId !== actor.id && !isChurchAdmin) {
                throw new common_1.ForbiddenException('Only the buyer or Church Admin can cancel this request');
            }
        }
        else if (order.status === client_1.OrderStatus.awaiting_delivery) {
            if (!isChurchAdmin) {
                throw new common_1.ForbiddenException('After acceptance, only the Church Admin can cancel (ORD-10)');
            }
        }
        else {
            throw new common_1.BadRequestException(`Cannot cancel order in status "${order.status}"`);
        }
        return this.prisma.$transaction(async (tx) => {
            if (order.status === client_1.OrderStatus.awaiting_delivery &&
                order.resource.format === client_1.ResourceFormat.hard_copy) {
                await tx.resource.update({
                    where: { id: order.resourceId },
                    data: { stock: { increment: order.quantity } },
                });
            }
            return tx.order.update({
                where: { id: orderId },
                data: { status: client_1.OrderStatus.cancelled, cancelReason: dto.reason },
            });
        });
    }
    async postOrderMessage(orderId, user, dto) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.buyerId !== user.id && order.sellerId !== user.id && !user.isPlatformAdmin) {
            throw new common_1.ForbiddenException('Only buyer and seller may message in this order');
        }
        return this.prisma.orderMessage.create({
            data: { orderId, senderId: user.id, body: dto.body },
        });
    }
    async listOrderMessages(orderId, user) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const isAdmin = user.isPlatformAdmin || user.administeredChurchIds.includes(order.churchId);
        if (order.buyerId !== user.id && order.sellerId !== user.id && !isAdmin) {
            throw new common_1.ForbiddenException('Not authorized to view order messages');
        }
        const messages = await this.prisma.orderMessage.findMany({
            where: { orderId },
            include: { sender: true },
            orderBy: { createdAt: 'asc' },
        });
        return messages.map((m) => ({ ...m, sender: (0, privacy_util_1.serializeMemberCard)(m.sender, user) }));
    }
    async getFulfilmentPool(actor) {
        const where = {
            status: { in: [client_1.OrderStatus.awaiting_delivery, client_1.OrderStatus.received] },
        };
        if (!actor.isPlatformAdmin) {
            if (actor.administeredChurchIds.length > 0) {
                where.OR = [
                    { churchId: { in: actor.administeredChurchIds } },
                    { sellerId: actor.id },
                ];
            }
            else {
                where.sellerId = actor.id;
            }
        }
        const orders = await this.prisma.order.findMany({
            where,
            include: { buyer: true, seller: true, resource: true },
            orderBy: { acceptedAt: 'asc' },
        });
        const now = Date.now();
        return orders.map((o) => ({
            ...o,
            waitingHours: o.acceptedAt ? Math.floor((now - o.acceptedAt.getTime()) / 3600000) : 0,
            buyer: (0, privacy_util_1.serializeMemberCard)(o.buyer, actor),
            seller: (0, privacy_util_1.serializeMemberCard)(o.seller, actor),
        }));
    }
    async getMyOrders(user) {
        const orders = await this.prisma.order.findMany({
            where: { buyerId: user.id },
            include: { resource: true, seller: true },
            orderBy: { createdAt: 'desc' },
        });
        return orders.map((o) => ({ ...o, seller: (0, privacy_util_1.serializeMemberCard)(o.seller, user) }));
    }
    async getMySales(user) {
        const orders = await this.prisma.order.findMany({
            where: { sellerId: user.id },
            include: { resource: true, buyer: true },
            orderBy: { createdAt: 'desc' },
        });
        return orders.map((o) => ({ ...o, buyer: (0, privacy_util_1.serializeMemberCard)(o.buyer, user) }));
    }
    computePlanEndDate(start, plan) {
        if (plan === client_1.SellerPlan.lifetime)
            return null;
        const end = new Date(start);
        switch (plan) {
            case client_1.SellerPlan.one_month:
                end.setMonth(end.getMonth() + 1);
                return end;
            case client_1.SellerPlan.one_year:
                end.setFullYear(end.getFullYear() + 1);
                return end;
            case client_1.SellerPlan.two_years:
                end.setFullYear(end.getFullYear() + 2);
                return end;
            case client_1.SellerPlan.three_years:
                end.setFullYear(end.getFullYear() + 3);
                return end;
            case client_1.SellerPlan.four_years:
                end.setFullYear(end.getFullYear() + 4);
                return end;
            case client_1.SellerPlan.five_years:
                end.setFullYear(end.getFullYear() + 5);
                return end;
            default:
                return end;
        }
    }
};
exports.MarketplaceService = MarketplaceService;
exports.MarketplaceService = MarketplaceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MarketplaceService);
//# sourceMappingURL=marketplace.service.js.map