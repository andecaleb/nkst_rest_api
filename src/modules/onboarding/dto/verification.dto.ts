import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationPathway } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SubmitVerificationRequestDto {
  @ApiProperty({ enum: VerificationPathway, example: VerificationPathway.catechism })
  @IsEnum(VerificationPathway)
  pathway: VerificationPathway;

  @ApiPropertyOptional({ example: 'Adult Catechism Class 2024' })
  @IsOptional()
  @IsString()
  programme?: string;

  @ApiPropertyOptional({ example: '2024-08-15' })
  @IsOptional()
  @IsDateString()
  completionDate?: string;

  @ApiPropertyOptional({ example: 'Completed catechism at NKST Mkar' })
  @IsOptional()
  @IsString()
  evidenceText?: string;

  @ApiPropertyOptional({ example: 'https://cdn.nkst.org.ng/certs/cert-123.pdf' })
  @IsOptional()
  @IsString()
  evidenceFileUrl?: string;
}

export class AcknowledgeMemberDto {
  @ApiPropertyOptional({ example: 'I personally know Terfa from NKST Gboko youth fellowship.' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ReviewVerificationDto {
  @ApiPropertyOptional({ example: 'Confirmed with church catechism register' })
  @IsOptional()
  @IsString()
  decisionNote?: string;

  @ApiPropertyOptional({ example: '2024-08-15' })
  @IsOptional()
  @IsDateString()
  completionDate?: string;
}

export class RejectVerificationDto {
  @ApiProperty({ example: 'Certificate photo is unreadable; please upload a clearer copy.' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class DirectValidateMemberDto {
  @ApiProperty({ description: 'Member UUID to validate directly (Pathway C or D)' })
  @IsUUID()
  memberId: string;

  @ApiPropertyOptional({ example: 'Known active member of the congregation' })
  @IsOptional()
  @IsString()
  decisionNote?: string;
}
