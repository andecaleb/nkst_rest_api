import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SellerPlan } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class GrantSellerAccessDto {
  @ApiProperty({ description: 'Verified member UUID to approve as seller' })
  @IsUUID()
  memberId: string;

  @ApiProperty({ enum: SellerPlan, example: SellerPlan.one_year })
  @IsEnum(SellerPlan)
  plan: SellerPlan;
}

export class RevokeSellerAccessDto {
  @ApiProperty({ example: 'Listing policy violation' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class HideListingDto {
  @ApiProperty({ example: 'Item description is misleading' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Approved resource UUID (paid listing or free hard copy)' })
  @IsUUID()
  resourceId: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number = 1;
}

export class DeclineOrderDto {
  @ApiProperty({ example: 'Currently out of stock until next week' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class CancelOrderDto {
  @ApiPropertyOptional({ example: 'Buyer no longer needs the item' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class OrderMessageDto {
  @ApiProperty({ example: 'Hello, can we arrange pickup after Sunday service at Mkar?' })
  @IsString()
  @IsNotEmpty()
  body: string;
}
