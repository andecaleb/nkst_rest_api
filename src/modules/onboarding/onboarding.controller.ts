import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import {
  AcknowledgeMemberDto,
  DirectValidateMemberDto,
  RejectVerificationDto,
  ReviewVerificationDto,
  SubmitVerificationRequestDto,
} from './dto/verification.dto';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ROLES } from '../../common/constants/roles.constant';
import { VerifiedMemberGuard } from '../../common/guards/verified-member.guard';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';

@ApiTags('04 — Membership Verification')
@ApiBearerAuth()
@Controller('verification')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get own verification status, acknowledgement counter, and history (VER-01, VER-05, VER-06)' })
  getMyStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.onboardingService.getMyVerificationStatus(user);
  }

  @Post('requests')
  @ApiOperation({ summary: 'Submit a membership verification request via any of the 4 pathways (VER-01)' })
  submitRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitVerificationRequestDto,
  ) {
    return this.onboardingService.submitRequest(user, dto);
  }

  @UseGuards(VerifiedMemberGuard)
  @Post('requests/:requestId/acknowledge')
  @ApiOperation({ summary: 'Acknowledge a member verification request (Pathway B — verified members only)' })
  acknowledge(
    @Param('requestId', UuidValidationPipe) requestId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AcknowledgeMemberDto,
  ) {
    return this.onboardingService.acknowledgeRequest(requestId, user, dto);
  }

  @Roles(ROLES.CHURCH_ADMIN, ROLES.PLATFORM_ADMIN)
  @Get('queue')
  @ApiQuery({ name: 'churchId', required: false })
  @ApiOperation({ summary: 'View verification review queue (VER-03)' })
  getQueue(@CurrentUser() actor: AuthenticatedUser, @Query('churchId') churchId?: string) {
    return this.onboardingService.getVerificationQueue(actor, churchId);
  }

  @Roles(ROLES.CHURCH_ADMIN, ROLES.PLATFORM_ADMIN)
  @Patch('requests/:requestId/approve')
  @ApiOperation({ summary: 'Approve a verification request and release held content (VER-07)' })
  approve(
    @Param('requestId', UuidValidationPipe) requestId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: ReviewVerificationDto,
  ) {
    return this.onboardingService.approveRequest(requestId, actor, dto);
  }

  @Roles(ROLES.CHURCH_ADMIN, ROLES.PLATFORM_ADMIN)
  @Patch('requests/:requestId/reject')
  @ApiOperation({ summary: 'Reject a verification request with a mandatory reason (VER-04)' })
  reject(
    @Param('requestId', UuidValidationPipe) requestId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: RejectVerificationDto,
  ) {
    return this.onboardingService.rejectRequest(requestId, actor, dto);
  }

  @Roles(ROLES.CHURCH_ADMIN, ROLES.PLATFORM_ADMIN)
  @Post('direct-validate')
  @ApiOperation({ summary: 'Directly validate a member via Church (Pathway C) or Platform (Pathway D) validation' })
  directValidate(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: DirectValidateMemberDto,
  ) {
    return this.onboardingService.directValidate(actor, dto);
  }
}
