import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Audience,
  DevicePlatform,
  MediaKind,
  ModerationActionType,
  PostCategory,
  PostType,
  ReactionKind,
  ReactionSubjectType,
  ReportReason,
  ReportSubjectType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/utils/pagination.util';

export class PostMediaItemDto {
  @ApiProperty({ enum: MediaKind })
  @IsEnum(MediaKind)
  kind: MediaKind;

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

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class CreatePostDto {
  @ApiProperty({ enum: PostType, default: PostType.text })
  @IsEnum(PostType)
  type: PostType;

  @ApiProperty({ enum: PostCategory, default: PostCategory.general })
  @IsEnum(PostCategory)
  category: PostCategory;

  @ApiProperty({ enum: Audience, default: Audience.church })
  @IsEnum(Audience)
  audience: Audience;

  @ApiPropertyOptional({ description: 'Required when audience is group' })
  @IsOptional()
  @IsUUID()
  audienceGroupId?: string;

  @ApiPropertyOptional({ example: 'Grace and peace to all brethren in Mkar!' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ type: [PostMediaItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostMediaItemDto)
  media?: PostMediaItemDto[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  saveAsDraft?: boolean;
}

export class UpdatePostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ enum: PostCategory })
  @IsOptional()
  @IsEnum(PostCategory)
  category?: PostCategory;
}

export class ModeratePostDto {
  @ApiProperty({ enum: ModerationActionType })
  @IsEnum(ModerationActionType)
  action: ModerationActionType;

  @ApiPropertyOptional({ description: 'Required for reject or request_correction' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class FilterFeedDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PostCategory })
  @IsOptional()
  @IsEnum(PostCategory)
  category?: PostCategory;

  @ApiPropertyOptional({ enum: PostType })
  @IsOptional()
  @IsEnum(PostType)
  type?: PostType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  churchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  groupId?: string;
}

export class CreateCommentDto {
  @ApiProperty({ example: 'Amen! Thank you for sharing.' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ description: 'Optional parent comment ID (1 level of replies supported — COM-02)' })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}

export class ToggleReactionDto {
  @ApiProperty({ enum: ReactionSubjectType })
  @IsEnum(ReactionSubjectType)
  subjectType: ReactionSubjectType;

  @ApiProperty()
  @IsUUID()
  subjectId: string;

  @ApiProperty({ enum: ReactionKind, example: ReactionKind.amen })
  @IsEnum(ReactionKind)
  kind: ReactionKind;
}

export class SharePostDto {
  @ApiPropertyOptional({ example: 'Sharing this important notice with brethren.' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateReportDto {
  @ApiProperty({ enum: ReportSubjectType })
  @IsEnum(ReportSubjectType)
  subjectType: ReportSubjectType;

  @ApiProperty()
  @IsUUID()
  subjectId: string;

  @ApiProperty({ enum: ReportReason })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  detail?: string;
}

export class HandleReportDto {
  @ApiProperty({ enum: ['dismiss', 'hide', 'remove'] })
  @IsString()
  @IsNotEmpty()
  decision: 'dismiss' | 'hide' | 'remove';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolutionNote?: string;
}

export class CreateOfficialAnnouncementDto {
  @ApiProperty({ enum: PostType, default: PostType.text })
  @IsEnum(PostType)
  type: PostType;

  @ApiProperty({ enum: PostCategory, default: PostCategory.announcement })
  @IsEnum(PostCategory)
  category: PostCategory;

  @ApiProperty({ enum: Audience, default: Audience.church })
  @IsEnum(Audience)
  audience: Audience;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  audienceChurchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  audienceGroupId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ default: 7, maximum: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  pinDays?: number;

  @ApiPropertyOptional({ type: [PostMediaItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostMediaItemDto)
  media?: PostMediaItemDto[];
}

export class CreateRecitationDto {
  @ApiProperty({ example: 'NKST Sunday Recitation — Week 48' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'The Lord is my shepherd; I shall not want...' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiProperty({ example: '2026-11-29' })
  @IsDateString()
  appliesOn: string;
}

export class RegisterDeviceTokenDto {
  @ApiProperty({ enum: DevicePlatform })
  @IsEnum(DevicePlatform)
  platform: DevicePlatform;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pushReactions?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pushComments?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pushAnnouncements?: boolean;
}
