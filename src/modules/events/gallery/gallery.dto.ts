import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PhotoCategory } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateAlbumDto {
  @ApiProperty({ example: '2026 Annual Synod Thanksgiving' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  eventDate?: string;
}

export class UploadPhotoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({ enum: PhotoCategory, default: PhotoCategory.worship_service })
  @IsEnum(PhotoCategory)
  category: PhotoCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  albumId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventName?: string;

  @ApiProperty({
    description: 'GAL-11: Uploader must confirm right to share and consent of pictured people',
    example: true,
  })
  @IsBoolean()
  consentConfirmed: boolean;

  @ApiProperty({
    description: 'GAL-12: Marks whether photo shows children/minors (always requires admin review)',
    default: false,
  })
  @IsBoolean()
  hasMinors: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  parentalConsentConfirmed?: boolean;
}

export class ReviewPhotoDto {
  @ApiProperty({ enum: ['approve', 'reject'] })
  @IsString()
  @IsNotEmpty()
  decision: 'approve' | 'reject';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Optional album UUID to move photo into (GAL-04)' })
  @IsOptional()
  @IsUUID()
  moveToAlbumId?: string;
}
