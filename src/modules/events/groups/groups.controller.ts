import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GroupScope, GroupVisibility } from '@prisma/client';
import { GroupsService } from './groups.service';
import { CreateGroupDto, DecideJoinRequestDto, InviteMemberDto } from './groups.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ROLES } from '../../../common/constants/roles.constant';
import { AuthenticatedUser, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { NotSuspendedGuard } from '../../../common/guards/not-suspended.guard';
import { UuidValidationPipe } from '../../../common/pipes/uuid-validation.pipe';

@ApiTags('06 — Groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Public()
  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'churchId', required: false })
  @ApiQuery({ name: 'scope', enum: GroupScope, required: false })
  @ApiQuery({ name: 'visibility', enum: GroupVisibility, required: false })
  @ApiOperation({ summary: 'Browse and filter groups (GRP-01)' })
  listGroups(
    @Query('search') search?: string,
    @Query('churchId') churchId?: string,
    @Query('scope') scope?: GroupScope,
    @Query('visibility') visibility?: GroupVisibility,
  ) {
    return this.groupsService.listGroups({ search, churchId, scope, visibility });
  }

  @ApiBearerAuth()
  @Roles(ROLES.CHURCH_ADMIN, ROLES.PLATFORM_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a church or national group with eligibility rules' })
  createGroup(@CurrentUser() actor: AuthenticatedUser, @Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(actor, dto);
  }

  @ApiBearerAuth()
  @UseGuards(NotSuspendedGuard)
  @Post(':groupId/join')
  @ApiOperation({ summary: 'Join an open group or request to join an approval group (GRP-02, GRP-03)' })
  joinGroup(
    @Param('groupId', UuidValidationPipe) groupId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.groupsService.joinOrRequestGroup(groupId, user);
  }

  @ApiBearerAuth()
  @Delete(':groupId/leave')
  @ApiOperation({ summary: 'Leave a group (GRP-07)' })
  leaveGroup(
    @Param('groupId', UuidValidationPipe) groupId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.groupsService.leaveGroup(groupId, user);
  }

  @Public()
  @Get(':groupId/members')
  @ApiOperation({ summary: 'List group members respecting group and member privacy' })
  listMembers(
    @Param('groupId', UuidValidationPipe) groupId: string,
    @CurrentUser() viewer?: AuthenticatedUser,
  ) {
    return this.groupsService.listGroupMembers(groupId, viewer);
  }

  @ApiBearerAuth()
  @Get(':groupId/requests')
  @ApiOperation({ summary: 'View pending join requests queue (Group Admin — GRP-04)' })
  listJoinRequests(
    @Param('groupId', UuidValidationPipe) groupId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.groupsService.listJoinRequests(groupId, actor);
  }

  @ApiBearerAuth()
  @Patch(':groupId/requests/:requestId')
  @ApiOperation({ summary: 'Approve or reject a join request (Group Admin — GRP-04)' })
  decideJoinRequest(
    @Param('groupId', UuidValidationPipe) groupId: string,
    @Param('requestId', UuidValidationPipe) requestId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: DecideJoinRequestDto,
  ) {
    return this.groupsService.decideJoinRequest(groupId, requestId, actor, dto);
  }

  @ApiBearerAuth()
  @Post(':groupId/invite')
  @ApiOperation({ summary: 'Invite an eligible member to the group (Group Admin — GRP-05)' })
  inviteMember(
    @Param('groupId', UuidValidationPipe) groupId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: InviteMemberDto,
  ) {
    return this.groupsService.inviteMember(groupId, dto.memberId, actor);
  }

  @ApiBearerAuth()
  @Patch(':groupId/members/:memberId/promote')
  @ApiOperation({ summary: 'Assign another Group Admin (GRP-06)' })
  promoteAdmin(
    @Param('groupId', UuidValidationPipe) groupId: string,
    @Param('memberId', UuidValidationPipe) memberId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.groupsService.promoteToGroupAdmin(groupId, memberId, actor);
  }

  @ApiBearerAuth()
  @Delete(':groupId/members/:memberId')
  @ApiOperation({ summary: 'Remove a member from the group (Group Admin — GRP-06)' })
  removeMember(
    @Param('groupId', UuidValidationPipe) groupId: string,
    @Param('memberId', UuidValidationPipe) memberId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.groupsService.removeMember(groupId, memberId, actor);
  }
}
