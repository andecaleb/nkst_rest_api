import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  RequestOtpDto,
  ResetPasswordDto,
  VerifyAccountDto,
} from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('02 — Authentication & Sessions')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new NKST member through a church (MEM-01..07)' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('verify-account')
  @ApiOperation({ summary: 'Verify email or phone with OTP to activate account (MEM-05)' })
  verifyAccount(@Body() dto: VerifyAccountDto) {
    return this.authService.verifyAccount(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend email or phone verification OTP (AUTH-05)' })
  resendOtp(@Body() dto: RequestOtpDto) {
    return this.authService.resendVerificationOtp(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @ApiOperation({ summary: 'Login with email or phone and password (AUTH-01)' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.ip);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh JWT access and refresh tokens (AUTH-03)' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('password-recovery/request')
  @ApiOperation({ summary: 'Request password recovery OTP via email or phone (AUTH-02)' })
  requestPasswordReset(@Body() dto: RequestOtpDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('password-recovery/reset')
  @ApiOperation({ summary: 'Reset password using OTP code (AUTH-02)' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @ApiBearerAuth()
  @Get('sessions')
  @ApiOperation({ summary: 'List active device sessions for the signed-in member (AUTH-03)' })
  listSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.listSessions(user.id);
  }

  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Sign out of current device session (AUTH-03)' })
  logout(@CurrentUser() user: AuthenticatedUser, @Body('deviceToken') deviceToken?: string) {
    return this.authService.logout(user.id, user.sessionId, deviceToken);
  }

  @ApiBearerAuth()
  @Post('logout-all')
  @ApiOperation({ summary: 'Sign out of all devices (AUTH-03)' })
  logoutAll(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logoutAll(user.id);
  }

  @ApiBearerAuth()
  @Post('deactivate')
  @ApiOperation({ summary: 'Deactivate own account; log in again to reactivate (AUTH-04)' })
  deactivate(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.deactivateAccount(user.id);
  }
}
