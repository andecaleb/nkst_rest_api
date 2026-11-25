import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  ResourceAccess,
  ResourceCategory,
  ResourceFormat,
  ResourceStatus,
  SellerAccessStatus,
  SellerPlan,
  VerificationState,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  CancelOrderDto,
  CreateOrderDto,
  DeclineOrderDto,
  GrantSellerAccessDto,
  HideListingDto,
  OrderMessageDto,
  RevokeSellerAccessDto,
} from './marketplace.dto';
import { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import { serializeMemberCard } from '../../../common/utils/privacy.util';

@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 09-marketplace.md Section 2: Church Admin approves seller and grants access period.
   * No payment is processed; tokenReference remains null in MVP.
   */
  async grantSellerAccess(actor: AuthenticatedUser, dto: GrantSellerAccessDto) {
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, deletedAt: null },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.verificationState !== VerificationState.verified) {
      throw new BadRequestException('Only verified members can be approved as sellers');
    }
    if (!actor.isPlatformAdmin && !actor.administeredChurchIds.includes(member.churchId)) {
      throw new ForbiddenException('You can only approve sellers in your own church');
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
        status: SellerAccessStatus.active,
        tokenReference: null, // Reserved for future finance module
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

  /**
   * MKT-05: Revoke seller approval with a reason.
   */
  async revokeSellerAccess(
    sellerAccessId: string,
    actor: AuthenticatedUser,
    dto: RevokeSellerAccessDto,
  ) {
    const access = await this.prisma.sellerAccess.findUnique({ where: { id: sellerAccessId } });
    if (!access) throw new NotFoundException('Seller access record not found');
    if (!actor.isPlatformAdmin && !actor.administeredChurchIds.includes(access.churchId)) {
      throw new ForbiddenException('Not authorized to revoke this seller access');
    }

    return this.prisma.sellerAccess.update({
      where: { id: sellerAccessId },
      data: { status: SellerAccessStatus.revoked, revokeReason: dto.reason },
    });
  }

  /**
   * MKT-01..06: Browse active marketplace listings.
   * Only shows paid, approved resources whose owner holds an active, non-expired SellerAccess.
   */
  async listMarketplaceListings(
    filters: {
      churchId?: string;
      category?: ResourceCategory;
      format?: ResourceFormat;
      minPrice?: number;
      maxPrice?: number;
      sellerId?: string;
    },
    viewer?: AuthenticatedUser,
  ) {
    const now = new Date();
    const activeSellers = await this.prisma.sellerAccess.findMany({
      where: {
        status: SellerAccessStatus.active,
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        ...(filters.churchId ? { churchId: filters.churchId } : {}),
        ...(filters.sellerId ? { memberId: filters.sellerId } : {}),
      },
      select: { memberId: true, churchId: true },
    });

    const eligibleSellerIds = Array.from(new Set(activeSellers.map((s) => s.memberId)));
    if (eligibleSellerIds.length === 0) return [];

    const listings = await this.prisma.resource.findMany({
      where: {
        access: ResourceAccess.paid,
        status: ResourceStatus.approved,
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
      outOfStock: item.format === ResourceFormat.hard_copy && (item.stock ?? 0) <= 0,
      seller: serializeMemberCard(item.owner, viewer),
      owner: undefined,
    }));
  }

  /**
   * MKT-04: Seller pauses or resumes their listing.
   */
  async togglePauseListing(resourceId: string, user: AuthenticatedUser, paused: boolean) {
    const resource = await this.prisma.resource.findFirst({
      where: { id: resourceId, ownerId: user.id, deletedAt: null },
    });
    if (!resource) throw new NotFoundException('Listing not found');
    return this.prisma.resource.update({
      where: { id: resourceId },
      data: { isListingPaused: paused },
    });
  }

  /**
   * MKT-05: Church Admin hides a listing with a reason.
   */
  async hideListing(resourceId: string, actor: AuthenticatedUser, dto: HideListingDto) {
    const resource = await this.prisma.resource.findFirst({
      where: { id: resourceId, deletedAt: null },
    });
    if (!resource) throw new NotFoundException('Listing not found');
    if (!actor.isPlatformAdmin && !actor.administeredChurchIds.includes(resource.churchId)) {
      throw new ForbiddenException('Only the Church Admin can hide listings in this church');
    }
    return this.prisma.resource.update({
      where: { id: resourceId },
      data: { isHiddenByAdmin: true, hiddenReason: dto.reason },
    });
  }

  /**
   * ORD-01..02: Verified member requests a paid listing or free hard copy (not their own).
   * paymentStatus is ALWAYS 'not_enabled' in MVP.
   */
  async createOrder(user: AuthenticatedUser, dto: CreateOrderDto) {
    const resource = await this.prisma.resource.findFirst({
      where: { id: dto.resourceId, status: ResourceStatus.approved, deletedAt: null },
    });
    if (!resource) throw new NotFoundException('Approved resource/listing not found');
    if (resource.ownerId === user.id) {
      throw new BadRequestException('You cannot request your own listing (ORD-01)');
    }

    if (resource.access === ResourceAccess.paid) {
      const activeSeller = await this.prisma.sellerAccess.findFirst({
        where: {
          memberId: resource.ownerId,
          churchId: resource.churchId,
          status: SellerAccessStatus.active,
          OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
        },
      });
      if (!activeSeller || resource.isListingPaused || resource.isHiddenByAdmin) {
        throw new BadRequestException('This listing is not currently available');
      }
    } else if (resource.format !== ResourceFormat.hard_copy) {
      throw new BadRequestException('Free digital resources can be downloaded directly without an order');
    }

    const quantity = dto.quantity ?? 1;
    if (resource.format === ResourceFormat.hard_copy && (resource.stock ?? 0) < quantity) {
      throw new BadRequestException('Insufficient stock available');
    }

    const order = await this.prisma.order.create({
      data: {
        resourceId: resource.id,
        buyerId: user.id,
        sellerId: resource.ownerId,
        churchId: resource.churchId,
        quantity,
        status: OrderStatus.requested,
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

  /**
   * ORD-04 & ORD-05: Seller accepts order.
   * - Digital -> immediately 'fulfilled' (buyer unlocks file download)
   * - Hard copy -> decrements stock & moves to 'awaiting_delivery' (church fulfilment pool)
   */
  async acceptOrder(orderId: string, seller: AuthenticatedUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { resource: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.sellerId !== seller.id) {
      throw new ForbiddenException('Only the seller can accept this order');
    }
    if (order.status !== OrderStatus.requested) {
      throw new BadRequestException(`Cannot accept order in status "${order.status}"`);
    }

    const isDigital = order.resource.format === ResourceFormat.digital;
    const nextStatus = isDigital ? OrderStatus.fulfilled : OrderStatus.awaiting_delivery;

    return this.prisma.$transaction(async (tx) => {
      if (!isDigital) {
        if ((order.resource.stock ?? 0) < order.quantity) {
          throw new BadRequestException('Insufficient stock to accept this hard-copy order');
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

  async declineOrder(orderId: string, seller: AuthenticatedUser, dto: DeclineOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.sellerId !== seller.id) {
      throw new ForbiddenException('Only the seller can decline this order');
    }
    if (order.status !== OrderStatus.requested) {
      throw new BadRequestException('Only requested orders can be declined');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.declined, declineReason: dto.reason },
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

  /**
   * ORD-08: Buyer confirms receipt ("I have received this") -> status 'received', notifies Church Admin.
   */
  async confirmReceipt(orderId: string, buyer: AuthenticatedUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { church: true, resource: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== buyer.id) {
      throw new ForbiddenException('Only the buyer can confirm receipt');
    }
    if (order.status !== OrderStatus.awaiting_delivery) {
      throw new BadRequestException('Order must be awaiting delivery to confirm receipt');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.received, receivedAt: new Date() },
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

  /**
   * ORD-09: Church Admin acknowledges received order -> status 'closed'.
   */
  async closeOrder(orderId: string, actor: AuthenticatedUser) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (!actor.isPlatformAdmin && !actor.administeredChurchIds.includes(order.churchId)) {
      throw new ForbiddenException('Only the Church Admin can close received orders');
    }
    if (order.status !== OrderStatus.received) {
      throw new BadRequestException('Only received orders can be closed');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.closed, closedById: actor.id, closedAt: new Date() },
    });
  }

  /**
   * ORD-10: Buyer can cancel before acceptance; after acceptance only Church Admin can cancel.
   * Cancelling a hard-copy order after acceptance restores stock.
   */
  async cancelOrder(orderId: string, actor: AuthenticatedUser, dto: CancelOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { resource: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const isChurchAdmin =
      actor.isPlatformAdmin || actor.administeredChurchIds.includes(order.churchId);

    if (order.status === OrderStatus.requested) {
      if (order.buyerId !== actor.id && !isChurchAdmin) {
        throw new ForbiddenException('Only the buyer or Church Admin can cancel this request');
      }
    } else if (order.status === OrderStatus.awaiting_delivery) {
      if (!isChurchAdmin) {
        throw new ForbiddenException('After acceptance, only the Church Admin can cancel (ORD-10)');
      }
    } else {
      throw new BadRequestException(`Cannot cancel order in status "${order.status}"`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (
        order.status === OrderStatus.awaiting_delivery &&
        order.resource.format === ResourceFormat.hard_copy
      ) {
        await tx.resource.update({
          where: { id: order.resourceId },
          data: { stock: { increment: order.quantity } },
        });
      }
      return tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.cancelled, cancelReason: dto.reason },
      });
    });
  }

  /**
   * ORD-03: Order message thread between buyer and seller (protects private seller details).
   */
  async postOrderMessage(orderId: string, user: AuthenticatedUser, dto: OrderMessageDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== user.id && order.sellerId !== user.id && !user.isPlatformAdmin) {
      throw new ForbiddenException('Only buyer and seller may message in this order');
    }

    return this.prisma.orderMessage.create({
      data: { orderId, senderId: user.id, body: dto.body },
    });
  }

  async listOrderMessages(orderId: string, user: AuthenticatedUser) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    const isAdmin = user.isPlatformAdmin || user.administeredChurchIds.includes(order.churchId);
    if (order.buyerId !== user.id && order.sellerId !== user.id && !isAdmin) {
      throw new ForbiddenException('Not authorized to view order messages');
    }

    const messages = await this.prisma.orderMessage.findMany({
      where: { orderId },
      include: { sender: true },
      orderBy: { createdAt: 'asc' },
    });
    return messages.map((m) => ({ ...m, sender: serializeMemberCard(m.sender, user) }));
  }

  /**
   * ORD-06 & ORD-11: Hard-copy fulfilment pool (with waiting time in hours).
   */
  async getFulfilmentPool(actor: AuthenticatedUser) {
    const where: any = {
      status: { in: [OrderStatus.awaiting_delivery, OrderStatus.received] },
    };

    if (!actor.isPlatformAdmin) {
      if (actor.administeredChurchIds.length > 0) {
        where.OR = [
          { churchId: { in: actor.administeredChurchIds } },
          { sellerId: actor.id },
        ];
      } else {
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
      buyer: serializeMemberCard(o.buyer, actor),
      seller: serializeMemberCard(o.seller, actor),
    }));
  }

  /**
   * ORD-12: My Orders (as buyer) and My Sales (as seller).
   */
  async getMyOrders(user: AuthenticatedUser) {
    const orders = await this.prisma.order.findMany({
      where: { buyerId: user.id },
      include: { resource: true, seller: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => ({ ...o, seller: serializeMemberCard(o.seller, user) }));
  }

  async getMySales(user: AuthenticatedUser) {
    const orders = await this.prisma.order.findMany({
      where: { sellerId: user.id },
      include: { resource: true, buyer: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => ({ ...o, buyer: serializeMemberCard(o.buyer, user) }));
  }

  private computePlanEndDate(start: Date, plan: SellerPlan): Date | null {
    if (plan === SellerPlan.lifetime) return null;
    const end = new Date(start);
    switch (plan) {
      case SellerPlan.one_month:
        end.setMonth(end.getMonth() + 1);
        return end;
      case SellerPlan.one_year:
        end.setFullYear(end.getFullYear() + 1);
        return end;
      case SellerPlan.two_years:
        end.setFullYear(end.getFullYear() + 2);
        return end;
      case SellerPlan.three_years:
        end.setFullYear(end.getFullYear() + 3);
        return end;
      case SellerPlan.four_years:
        end.setFullYear(end.getFullYear() + 4);
        return end;
      case SellerPlan.five_years:
        end.setFullYear(end.getFullYear() + 5);
        return end;
      default:
        return end;
    }
  }
}
