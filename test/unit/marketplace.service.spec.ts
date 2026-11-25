import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  OrderStatus,
  ResourceAccess,
  ResourceFormat,
  ResourceStatus,
  SellerAccessStatus,
  VerificationState,
} from '@prisma/client';
import { MarketplaceService } from '../../src/modules/events/marketplace/marketplace.service';
import { AuthenticatedUser } from '../../src/common/decorators/current-user.decorator';

describe('MarketplaceService (Unit — No Financials)', () => {
  let service: MarketplaceService;
  let prisma: any;

  const buyer: AuthenticatedUser = {
    id: 'buyer-1',
    email: 'buyer@example.com',
    phone: '+2348001',
    churchId: 'church-1',
    verificationState: VerificationState.verified,
    isPlatformAdmin: false,
    administeredChurchIds: [],
    roles: ['MEMBER'],
  };

  const seller: AuthenticatedUser = {
    id: 'seller-1',
    email: 'seller@example.com',
    phone: '+2348002',
    churchId: 'church-1',
    verificationState: VerificationState.verified,
    isPlatformAdmin: false,
    administeredChurchIds: [],
    roles: ['MEMBER'],
  };

  beforeEach(() => {
    prisma = {
      resource: { findFirst: jest.fn(), update: jest.fn() },
      sellerAccess: { findFirst: jest.fn(), create: jest.fn() },
      order: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      notification: { create: jest.fn() },
      $transaction: jest.fn((cb: any) => cb(prisma)),
    };
    service = new MarketplaceService(prisma);
  });

  it('prevents a member from requesting their own listing (ORD-01)', async () => {
    prisma.resource.findFirst.mockResolvedValue({
      id: 'res-1',
      ownerId: buyer.id,
      churchId: 'church-1',
      access: ResourceAccess.paid,
      format: ResourceFormat.digital,
      status: ResourceStatus.approved,
    });

    await expect(service.createOrder(buyer, { resourceId: 'res-1', quantity: 1 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('always sets paymentStatus to not_enabled when creating an order', async () => {
    prisma.resource.findFirst.mockResolvedValue({
      id: 'res-1',
      title: 'Tiv Hymnal PDF',
      ownerId: seller.id,
      churchId: 'church-1',
      access: ResourceAccess.paid,
      format: ResourceFormat.digital,
      status: ResourceStatus.approved,
      isListingPaused: false,
      isHiddenByAdmin: false,
    });
    prisma.sellerAccess.findFirst.mockResolvedValue({
      id: 'sa-1',
      status: SellerAccessStatus.active,
      endsAt: null,
    });
    prisma.order.create.mockImplementation(({ data }: any) => ({ id: 'ord-1', ...data }));

    const order = await service.createOrder(buyer, { resourceId: 'res-1', quantity: 1 });
    expect(order.paymentStatus).toBe('not_enabled');
    expect(order.status).toBe(OrderStatus.requested);
  });

  it('marks digital orders as fulfilled immediately upon seller acceptance (ORD-04)', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord-1',
      buyerId: buyer.id,
      sellerId: seller.id,
      resourceId: 'res-1',
      quantity: 1,
      status: OrderStatus.requested,
      resource: { title: 'Audio Sermon', format: ResourceFormat.digital, stock: null },
    });
    prisma.order.update.mockImplementation(({ data }: any) => ({ id: 'ord-1', ...data }));

    const res = await service.acceptOrder('ord-1', seller);
    expect(res.status).toBe(OrderStatus.fulfilled);
  });

  it('decrements stock and moves hard-copy order to awaiting_delivery on acceptance (ORD-05)', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord-2',
      buyerId: buyer.id,
      sellerId: seller.id,
      resourceId: 'res-hc',
      quantity: 2,
      status: OrderStatus.requested,
      resource: { title: 'Printed Catechism Book', format: ResourceFormat.hard_copy, stock: 5 },
    });
    prisma.order.update.mockImplementation(({ data }: any) => ({ id: 'ord-2', ...data }));

    const res = await service.acceptOrder('ord-2', seller);
    expect(res.status).toBe(OrderStatus.awaiting_delivery);
    expect(prisma.resource.update).toHaveBeenCalledWith({
      where: { id: 'res-hc' },
      data: { stock: { decrement: 2 } },
    });
  });

  it('blocks buyer from cancelling an already accepted order (ORD-10)', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord-2',
      buyerId: buyer.id,
      sellerId: seller.id,
      churchId: 'church-1',
      status: OrderStatus.awaiting_delivery,
      resource: { format: ResourceFormat.hard_copy },
    });

    await expect(service.cancelOrder('ord-2', buyer, { reason: 'Changed mind' })).rejects.toThrow(
      ForbiddenException,
    );
  });
});
