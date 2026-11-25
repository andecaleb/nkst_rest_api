import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, ProfileVisibility } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  surname?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

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
  residentialLocation?: string;
}

export class TogglePrivacyDto {
  @ApiProperty({ enum: ProfileVisibility, example: ProfileVisibility.private })
  @IsEnum(ProfileVisibility)
  profileVisibility: ProfileVisibility;
}

export class ChangeChurchDto {
  @ApiProperty({ description: 'New active church UUID (PRO-05)' })
  @IsUUID()
  churchId: string;
}

export class SocialLinkDto {
  @ApiProperty({ example: 'LinkedIn' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 'https://linkedin.com/in/terfa-tarka' })
  @IsUrl()
  url: string;
}

export class SuspendMemberDto {
  @ApiProperty({ example: 'Repeated violation of community posting guidelines' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
