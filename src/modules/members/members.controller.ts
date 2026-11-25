import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MembersService } from './members.service';
import {
  ChangeChurchDto,
  SocialLinkDto,
  SuspendMemberDto,
  TogglePrivacyDto,
  UpdateProfileDto,
} from './dto/member.dto';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ROLES } from '../../common/constants/roles.constant';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';

@ApiTags('02 — Members & Profiles')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get authenticated member profile (PRO-01)' })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.membersService.getMyProfile(user);
  }

  @ApiBearerAuth()
  @Patch('me')
  @ApiOperation({ summary: 'Update own profile; re-checks group eligibility (PRO-01, GRP-09)' })
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.membersService.updateMyProfile(user, dto);
  }

  @ApiBearerAuth()
  @Patch('me/privacy')
  @ApiOperation({ summary: 'Toggle public/private profile visibility (PRIV-01, PRIV-02)' })
  togglePrivacy(@CurrentUser() user: AuthenticatedUser, @Body() dto: TogglePrivacyDto) {
    return this.membersService.togglePrivacy(user, dto);
  }

  @ApiBearerAuth()
  @Patch('me/church')
  @ApiOperation({ summary: 'Change church affiliation; resets church-level verification (PRO-05)' })
  changeChurch(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangeChurchDto) {
    return this.membersService.changeChurch(user, dto);
  }

  @ApiBearerAuth()
  @Post('me/social-links')
  @ApiOperation({ summary: 'Add a social link to own profile' })
  addSocialLink(@CurrentUser() user: AuthenticatedUser, @Body() dto: SocialLinkDto) {
    return this.membersService.addSocialLink(user, dto);
  }

  @ApiBearerAuth()
  @Delete('me/social-links/:linkId')
  @ApiOperation({ summary: 'Remove a social link from own profile' })
  deleteSocialLink(
    @CurrentUser() user: AuthenticatedUser,
    @Param('linkId', UuidValidationPipe) linkId: string,
  ) {
    return this.membersService.deleteSocialLink(user, linkId);
  }

  @Public()
  @Get(':memberId')
  @ApiOperation({ summary: 'View member profile respecting privacy masking (PRO-01..04, PRIV-03)' })
  getMemberProfile(
    @Param('memberId', UuidValidationPipe) memberId: string,
    @CurrentUser() viewer?: AuthenticatedUser,
  ) {
    return this.membersService.getMemberProfile(memberId, viewer);
  }

  @ApiBearerAuth()
  @Roles(ROLES.CHURCH_ADMIN, ROLES.PLATFORM_ADMIN)
  @Patch(':memberId/suspend')
  @ApiOperation({ summary: 'Suspend a member with a reason (VER-08)' })
  suspendMember(
    @Param('memberId', UuidValidationPipe) memberId: string,
    @Body() dto: SuspendMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.membersService.suspendMember(memberId, dto, user);
  }

  @ApiBearerAuth()
  @Roles(ROLES.CHURCH_ADMIN, ROLES.PLATFORM_ADMIN)
  @Patch(':memberId/reinstate')
  @ApiOperation({ summary: 'Reinstate a suspended member (VER-08)' })
  reinstateMember(
    @Param('memberId', UuidValidationPipe) memberId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.membersService.reinstateMember(memberId, user);
  }
}
