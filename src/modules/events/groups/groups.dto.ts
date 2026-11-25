import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  GenderRestriction,
  GroupJoinMode,
  GroupScope,
  GroupVisibility,
} from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'NKST Mkar Youth Fellowship' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Fellowship and Bible study for young adults aged 18 to 35.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiProperty({ enum: GroupScope, default: GroupScope.church })
  @IsEnum(GroupScope)
  scope: GroupScope;

  @ApiPropertyOptional({ description: 'Church ID for church-scoped groups' })
  @IsOptional()
  @IsUUID()
  churchId?: string;

  @ApiProperty({ enum: GroupVisibility, default: GroupVisibility.public })
  @IsEnum(GroupVisibility)
  visibility: GroupVisibility;

  @ApiProperty({ enum: GroupJoinMode, default: GroupJoinMode.open })
  @IsEnum(GroupJoinMode)
  joinMode: GroupJoinMode;

  @ApiPropertyOptional({ enum: GenderRestriction, default: GenderRestriction.any })
  @IsOptional()
  @IsEnum(GenderRestriction)
  genderRestriction?: GenderRestriction = GenderRestriction.any;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  minAge?: number;

  @ApiPropertyOptional({ example: 35 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  maxAge?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  verifiedOnly?: boolean = false;

  @ApiPropertyOptional({ type: [String], description: 'Optional list of allowed church UUIDs' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  allowedChurchIds?: string[];
}

export class DecideJoinRequestDto {
  @ApiProperty({ enum: ['approve', 'reject'] })
  @IsString()
  @IsNotEmpty()
  decision: 'approve' | 'reject';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class InviteMemberDto {
  @ApiProperty()
  @IsUUID()
  memberId: string;
}
