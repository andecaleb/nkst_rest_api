import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, TokenChannel } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Terfa' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional({ example: 'Aondowase' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ example: 'Tarka' })
  @IsString()
  @IsNotEmpty()
  surname: string;

  @ApiProperty({ example: 'terfa.tarka@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+2348031234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'StrongPass@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: Gender, example: Gender.male })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: '1996-05-14' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ example: 'Benue' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: 'Gboko' })
  @IsString()
  @IsNotEmpty()
  lga: string;

  @ApiProperty({ example: 'No. 14 Mkar Road, Gboko' })
  @IsString()
  @IsNotEmpty()
  residentialLocation: string;

  @ApiProperty({ description: 'UUID of an active NKST church (MEM-02)' })
  @IsUUID()
  churchId: string;

  @ApiPropertyOptional({ example: 'https://cdn.nkst.org.ng/avatars/terfa.jpg' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ enum: TokenChannel, default: TokenChannel.email })
  @IsOptional()
  @IsEnum(TokenChannel)
  verificationChannel?: TokenChannel = TokenChannel.email;
}

export class LoginDto {
  @ApiProperty({
    description: 'Email address or phone number (AUTH-01)',
    example: 'admin@nkst.org.ng',
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ example: 'ChangeMe@123!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ example: 'iPhone 15 Pro / iOS 18' })
  @IsOptional()
  @IsString()
  deviceInfo?: string;
}

export class VerifyAccountDto {
  @ApiProperty({ description: 'Email or phone used during registration' })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ enum: TokenChannel, example: TokenChannel.email })
  @IsEnum(TokenChannel)
  channel: TokenChannel;
}

export class RequestOtpDto {
  @ApiProperty({ description: 'Email or phone' })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ enum: TokenChannel, default: TokenChannel.email })
  @IsEnum(TokenChannel)
  channel: TokenChannel;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Email or phone' })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'NewStrongPass@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
