import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResourceCategory, ResourceFormat } from '@prisma/client';
import { MarketplaceService } from './marketplace.service';
import {
  CancelOrderDto,
  CreateOrderDto,
  DeclineOrderDto,
  GrantSellerAccessDto,
  HideListingDto,
  OrderMessageDto,
  RevokeSellerAccessDto,
} from './marketplace.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ROLES } from '../../../common/constants/roles.constant';
import { AuthenticatedUser, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { NotSuspendedGuard } from '../../../common/guards/not-suspended.guard';
import { VerifiedMemberGuard } from '../../../common/guards/verified-member.guard';
import { UuidValidationPipe } from '../../../common/pipes/uuid-validation.pipe';

@ApiTags('09 — Marketplace (No Financials)')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Public()
  @Get('listings')
  @ApiQuery({ name: 'churchId', required: false })
  @ApiQuery({ name: 'category', enum: ResourceCategory, required: false })
  @ApiQuery({ name: 'format', enum: ResourceFormat, required: false })
  @ApiQuery({ name: 'minPrice', type: Number, required: false })
  @ApiQuery({ name: 'maxPrice', type: Number, required: false })
  @ApiQuery({ name: 'sellerId', required: false })
  @ApiOperation({ summary: 'Browse active church marketplace listings (MKT-01..06)' })
  listListings(
    @Query('churchId') churchId?: string,
    @Query('category') category?: ResourceCategory,
    @Query('format') format?: ResourceFormat,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('sellerId') sellerId?: string,
    @CurrentUser() viewer?: AuthenticatedUser,
  ) {
    return this.marketplaceService.listMarketplaceListings(
      { churchId, category, format, minPrice, maxPrice, sellerId },
      viewer,
    );
  }

  @ApiBearerAuth()
  @Roles(ROLES.CHURCH_ADMIN, ROLES.PLATFORM_ADMIN)
  @Post('sellers/grant')
  @ApiOperation({ summary: 'Approve a verified member as seller and grant access period (no payment)' })
  grantSellerAccess(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: GrantSellerAccessDto,
  ) {
    return this.marketplaceService.grantSellerAccess(actor, dto);
  }

  @ApiBearerAuth()
  @Roles(ROLES.CHURCH_ADMIN, ROLES.PLATFORM_ADMIN)
  @Patch('sellers/:sellerAccessId/revoke')
  @ApiOperation({ summary: 'Revoke seller access with a reason (MKT-05)' })
  revokeSeller(
    @Param('sellerAccessId', UuidValidationPipe) sellerAccessId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: RevokeSellerAccessDto,
  ) {
    return this.marketplaceService.revokeSellerAccess(sellerAccessId, actor, dto);
  }

  @ApiBearerAuth()
  @Patch('listings/:resourceId/pause')
  @ApiOperation({ summary: 'Pause or resume own marketplace listing (MKT-04)' })
  togglePause(
    @Param('resourceId', UuidValidationPipe) resourceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('paused') paused: boolean,
  ) {
    return this.marketplaceService.togglePauseListing(resourceId, user, Boolean(paused));
  }

  @ApiBearerAuth()
  @Roles(ROLES.CHURCH_ADMIN, ROLES.PLATFORM_ADMIN)
  @Patch('listings/:resourceId/hide')
  @ApiOperation({ summary: 'Hide a listing with a reason (Church Admin — MKT-05)' })
  hideListing(
    @Param('resourceId', UuidValidationPipe) resourceId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: HideListingDto,
  ) {
    return this.marketplaceService.hideListing(resourceId, actor, dto);
  }

  @ApiBearerAuth()
  @UseGuards(NotSuspendedGuard, VerifiedMemberGuard)
  @Post('orders')
  @ApiOperation({ summary: 'Request a marketplace listing or free hard copy (ORD-01, payment_status=not_enabled)' })
  createOrder(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.marketplaceService.createOrder(user, dto);
  }

  @ApiBearerAuth()
  @Get('orders/my-orders')
  @ApiOperation({ summary: 'List My Orders as buyer (ORD-12)' })
  getMyOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.marketplaceService.getMyOrders(user);
  }

  @ApiBearerAuth()
  @Get('orders/my-sales')
  @ApiOperation({ summary: 'List My Sales as seller (ORD-12)' })
  getMySales(@CurrentUser() user: AuthenticatedUser) {
    return this.marketplaceService.getMySales(user);
  }

  @ApiBearerAuth()
  @Get('fulfilment-pool')
  @ApiOperation({ summary: 'View hard-copy fulfilment pool with waiting times (ORD-06, ORD-11)' })
  getFulfilmentPool(@CurrentUser() actor: AuthenticatedUser) {
    return this.marketplaceService.getFulfilmentPool(actor);
  }

  @ApiBearerAuth()
  @Patch('orders/:orderId/accept')
  @ApiOperation({ summary: 'Seller accepts order (digital -> fulfilled; hard copy -> awaiting_delivery)' })
  acceptOrder(
    @Param('orderId', UuidValidationPipe) orderId: string,
    @CurrentUser() seller: AuthenticatedUser,
  ) {
    return this.marketplaceService.acceptOrder(orderId, seller);
  }

  @ApiBearerAuth()
  @Patch('orders/:orderId/decline')
  @ApiOperation({ summary: 'Seller declines order with reason (ORD-02)' })
  declineOrder(
    @Param('orderId', UuidValidationPipe) orderId: string,
    @CurrentUser() seller: AuthenticatedUser,
    @Body() dto: DeclineOrderDto,
  ) {
    return this.marketplaceService.declineOrder(orderId, seller, dto);
  }

  @ApiBearerAuth()
  @Patch('orders/:orderId/confirm-receipt')
  @ApiOperation({ summary: 'Buyer confirms receipt of hard-copy item; notifies Church Admin (ORD-08)' })
  confirmReceipt(
    @Param('orderId', UuidValidationPipe) orderId: string,
    @CurrentUser() buyer: AuthenticatedUser,
  ) {
    return this.marketplaceService.confirmReceipt(orderId, buyer);
  }

  @ApiBearerAuth()
  @Roles(ROLES.CHURCH_ADMIN, ROLES.PLATFORM_ADMIN)
  @Patch('orders/:orderId/close')
  @ApiOperation({ summary: 'Church Admin acknowledges receipt and closes order (ORD-09)' })
  closeOrder(
    @Param('orderId', UuidValidationPipe) orderId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.marketplaceService.closeOrder(orderId, actor);
  }

  @ApiBearerAuth()
  @Patch('orders/:orderId/cancel')
  @ApiOperation({ summary: 'Cancel order (buyer before acceptance; Church Admin after acceptance — ORD-10)' })
  cancelOrder(
    @Param('orderId', UuidValidationPipe) orderId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CancelOrderDto,
  ) {
    return this.marketplaceService.cancelOrder(orderId, actor, dto);
  }

  @ApiBearerAuth()
  @Get('orders/:orderId/messages')
  @ApiOperation({ summary: 'List order messages between buyer and seller (ORD-03)' })
  listOrderMessages(
    @Param('orderId', UuidValidationPipe) orderId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.marketplaceService.listOrderMessages(orderId, user);
  }

  @ApiBearerAuth()
  @Post('orders/:orderId/messages')
  @ApiOperation({ summary: 'Send a message in an order thread (ORD-03)' })
  postOrderMessage(
    @Param('orderId', UuidValidationPipe) orderId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: OrderMessageDto,
  ) {
    return this.marketplaceService.postOrderMessage(orderId, user, dto);
  }
}
