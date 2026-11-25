import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ResourceAccess,
  ResourceCategory,
  ResourceFormat,
  ResourceType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class ResourceFileItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  sizeBytes: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPreviewImage?: boolean;
}

export class CreateResourceDto {
  @ApiProperty({ example: 'NKST Hymnal & Liturgy Study Guide' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Comprehensive study guide for choir and congregation.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ResourceCategory, default: ResourceCategory.study_and_training })
  @IsEnum(ResourceCategory)
  category: ResourceCategory;

  @ApiProperty({ enum: ResourceType, default: ResourceType.document })
  @IsEnum(ResourceType)
  resourceType: ResourceType;

  @ApiProperty({ enum: ResourceFormat, default: ResourceFormat.digital })
  @IsEnum(ResourceFormat)
  format: ResourceFormat;

  @ApiProperty({ enum: ResourceAccess, default: ResourceAccess.free })
  @IsEnum(ResourceAccess)
  access: ResourceAccess;

  @ApiPropertyOptional({ description: 'Informational NGN price (required if paid)', example: 2500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Stock quantity for hard_copy format', example: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ default: false, description: 'Church Admin only (RES-08)' })
  @IsOptional()
  @IsBoolean()
  isChurchOwned?: boolean;

  @ApiPropertyOptional({ type: [ResourceFileItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResourceFileItemDto)
  files?: ResourceFileItemDto[];
}

export class UpdateResourceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ResourceCategory })
  @IsOptional()
  @IsEnum(ResourceCategory)
  category?: ResourceCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ type: [ResourceFileItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResourceFileItemDto)
  files?: ResourceFileItemDto[];
}

export class ReviewResourceDto {
  @ApiProperty({ enum: ['approve', 'reject'] })
  @IsString()
  @IsNotEmpty()
  decision: 'approve' | 'reject';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ enum: ResourceCategory, description: 'Admin may adjust category (RES-05)' })
  @IsOptional()
  @IsEnum(ResourceCategory)
  category?: ResourceCategory;
}
