import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChurchStatus } from '@prisma/client';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/utils/pagination.util';

export class CreateChurchDto {
  @ApiProperty({ example: 'NKST Church Iortyer' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Benue' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: 'Makurdi' })
  @IsString()
  @IsNotEmpty()
  lga: string;

  @ApiProperty({ example: 'Iortyer' })
  @IsString()
  @IsNotEmpty()
  town: string;

  @ApiProperty({ example: 'Iortyer Layout, Makurdi, Benue State' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: 'Near Modern Market Roundabout' })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiProperty({ type: [String], example: ['+2348030000002'] })
  @IsArray()
  @IsString({ each: true })
  phones: string[];

  @ApiPropertyOptional({ example: 'iortyer@nkst.org.ng' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 7.7322 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 8.5391 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export class UpdateChurchDto {
  @ApiPropertyOptional({ description: 'Platform Admin only (CHR-09)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Platform Admin only (CHR-09)' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Platform Admin only (CHR-09)' })
  @IsOptional()
  @IsString()
  lga?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  town?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phones?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ enum: ChurchStatus, description: 'Platform Admin only (CHR-07)' })
  @IsOptional()
  @IsEnum(ChurchStatus)
  status?: ChurchStatus;
}

export class AssignChurchAdminDto {
  @ApiProperty({ description: 'Member UUID to assign as sole Church Admin (CHR-04)' })
  @IsUUID()
  memberId: string;
}

export class FilterChurchesDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lga?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  town?: string;

  @ApiPropertyOptional({ enum: ChurchStatus })
  @IsOptional()
  @IsEnum(ChurchStatus)
  status?: ChurchStatus;
}
