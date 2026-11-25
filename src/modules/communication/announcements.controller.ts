import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PostCategory } from '@prisma/client';
import { AnnouncementsService } from './announcements.service';
import {
  CreateOfficialAnnouncementDto,
  CreateRecitationDto,
  RegisterDeviceTokenDto,
  UpdateNotificationPreferencesDto,
} from './dto/communication.dto';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ROLES } from '../../common/constants/roles.constant';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';

@ApiTags('10 — Announcements, Recitations & Notifications')
@Controller('communication')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Public()
  @Get('announcements')
  @ApiQuery({ name: 'category', enum: PostCategory, required: false })
  @ApiQuery({ name: 'churchId', required: false })
  @ApiOperation({ summary: 'List official announcements (ANN-02)' })
  listAnnouncements(
    @Query('category') category?: PostCategory,
    @Query('churchId') churchId?: string,
  ) {
    return this.announcementsService.listAnnouncements({ category, churchId });
  }

  @ApiBearerAuth()
  @Roles(ROLES.GROUP_ADMIN, ROLES.CHURCH_ADMIN, ROLES.PLATFORM_ADMIN)
  @Post('announcements')
  @ApiOperation({ summary: 'Publish an official announcement skipping moderation (ANN-01..06)' })
  publishAnnouncement(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateOfficialAnnouncementDto,
  ) {
    return this.announcementsService.publishAnnouncement(actor, dto);
  }

  @Public()
  @Get('recitations')
  @ApiQuery({ name: 'search', required: false })
  @ApiOperation({ summary: 'List published national NKST recitations (REC-02, REC-03)' })
  listRecitations(@Query('search') search?: string) {
    return this.announcementsService.listPublishedRecitations(search);
  }

  @ApiBearerAuth()
  @Roles(ROLES.PLATFORM_ADMIN)
  @Post('recitations')
  @ApiOperation({ summary: 'Create a draft recitation (Platform Admin — REC-01)' })
  createRecitation(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateRecitationDto,
  ) {
    return this.announcementsService.createRecitation(actor, dto);
  }

  @ApiBearerAuth()
  @Roles(ROLES.PLATFORM_ADMIN)
  @Patch('recitations/:recitationId/publish')
  @ApiOperation({ summary: 'Publish a recitation and notify all members (REC-01, REC-05)' })
  publishRecitation(@Param('recitationId', UuidValidationPipe) recitationId: string) {
    return this.announcementsService.publishRecitation(recitationId);
  }

  @ApiBearerAuth()
  @Roles(ROLES.PLATFORM_ADMIN)
  @Patch('recitations/:recitationId/unpublish')
  @ApiOperation({ summary: 'Unpublish a recitation (Platform Admin — REC-01)' })
  unpublishRecitation(@Param('recitationId', UuidValidationPipe) recitationId: string) {
    return this.announcementsService.unpublishRecitation(recitationId);
  }

  @ApiBearerAuth()
  @Get('notifications')
  @ApiOperation({ summary: 'Get in-app notifications and unread count (NOT-01)' })
  listNotifications(@CurrentUser() user: AuthenticatedUser) {
    return this.announcementsService.listNotifications(user);
  }

  @ApiBearerAuth()
  @Patch('notifications/:notificationId/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('notificationId', UuidValidationPipe) notificationId: string,
  ) {
    return this.announcementsService.markNotificationRead(user, notificationId);
  }

  @ApiBearerAuth()
  @Patch('notifications/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.announcementsService.markAllNotificationsRead(user);
  }

  @ApiBearerAuth()
  @Post('notifications/device-token')
  @ApiOperation({ summary: 'Register push notification device token on login (NOT-04)' })
  registerDeviceToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    return this.announcementsService.registerDeviceToken(user, dto);
  }

  @ApiBearerAuth()
  @Patch('notifications/preferences')
  @ApiOperation({ summary: 'Update push notification preferences (NOT-03)' })
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.announcementsService.updateNotificationPreferences(user, dto);
  }
}
