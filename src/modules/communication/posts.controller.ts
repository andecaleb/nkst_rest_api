import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReportStatus } from '@prisma/client';
import { PostsService } from './posts.service';
import {
  CreateCommentDto,
  CreatePostDto,
  CreateReportDto,
  FilterFeedDto,
  HandleReportDto,
  ModeratePostDto,
  SharePostDto,
  ToggleReactionDto,
  UpdatePostDto,
} from './dto/communication.dto';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ROLES } from '../../common/constants/roles.constant';
import { NotSuspendedGuard } from '../../common/guards/not-suspended.guard';
import { VerifiedMemberGuard } from '../../common/guards/verified-member.guard';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';

@ApiTags('05 — Posts, Comments & Moderation')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Public()
  @Get('feed')
  @ApiOperation({ summary: 'Get Home / Church / Group feed of approved posts' })
  getFeed(@Query() query: FilterFeedDto, @CurrentUser() viewer?: AuthenticatedUser) {
    return this.postsService.getHomeFeed(query, viewer);
  }

  @ApiBearerAuth()
  @UseGuards(NotSuspendedGuard)
  @Post()
  @ApiOperation({ summary: 'Create a post (held_unverified if unverified; pending_review if verified)' })
  createPost(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePostDto) {
    return this.postsService.createPost(user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(NotSuspendedGuard)
  @Patch(':postId')
  @ApiOperation({ summary: 'Edit own post; editing an approved post triggers re-moderation (POST-07)' })
  updatePost(
    @Param('postId', UuidValidationPipe) postId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(postId, user, dto);
  }

  @ApiBearerAuth()
  @Delete(':postId')
  @ApiOperation({ summary: 'Soft-delete a post (retained for admin review)' })
  deletePost(
    @Param('postId', UuidValidationPipe) postId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.postsService.softDeletePost(postId, user);
  }

  @ApiBearerAuth()
  @Roles(ROLES.CHURCH_ADMIN, ROLES.GROUP_ADMIN, ROLES.PLATFORM_ADMIN)
  @Get('moderation/queue')
  @ApiOperation({ summary: 'View post moderation queue (POST-05)' })
  getModerationQueue(@CurrentUser() actor: AuthenticatedUser, @Query() query: FilterFeedDto) {
    return this.postsService.getModerationQueue(actor, query);
  }

  @ApiBearerAuth()
  @Roles(ROLES.CHURCH_ADMIN, ROLES.GROUP_ADMIN, ROLES.PLATFORM_ADMIN)
  @Patch(':postId/moderate')
  @ApiOperation({ summary: 'Approve, reject, or request corrections on a post (POST-04, POST-06)' })
  moderatePost(
    @Param('postId', UuidValidationPipe) postId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: ModeratePostDto,
  ) {
    return this.postsService.moderatePost(postId, actor, dto);
  }

  @ApiBearerAuth()
  @Roles(ROLES.CHURCH_ADMIN, ROLES.GROUP_ADMIN, ROLES.PLATFORM_ADMIN)
  @Get(':postId/moderation-history')
  @ApiOperation({ summary: 'View moderation history for a post (POST-06)' })
  getModerationHistory(@Param('postId', UuidValidationPipe) postId: string) {
    return this.postsService.getPostModerationHistory(postId);
  }

  @Public()
  @Get(':postId/comments')
  @ApiOperation({ summary: 'List visible comments and 1-level replies for a post' })
  listComments(
    @Param('postId', UuidValidationPipe) postId: string,
    @CurrentUser() viewer?: AuthenticatedUser,
  ) {
    return this.postsService.listComments(postId, viewer);
  }

  @ApiBearerAuth()
  @UseGuards(NotSuspendedGuard)
  @Post(':postId/comments')
  @ApiOperation({ summary: 'Add a comment or reply to an approved post (COM-01..05)' })
  addComment(
    @Param('postId', UuidValidationPipe) postId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postsService.addComment(postId, user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(NotSuspendedGuard, VerifiedMemberGuard)
  @Post('reactions')
  @ApiOperation({ summary: 'Toggle or change reaction (Like, Amen, Love) on a post or comment (REA-01)' })
  toggleReaction(@CurrentUser() user: AuthenticatedUser, @Body() dto: ToggleReactionDto) {
    return this.postsService.toggleReaction(user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(NotSuspendedGuard)
  @Post(':postId/share')
  @ApiOperation({ summary: 'Share an approved post within its audience limits (SHA-01)' })
  sharePost(
    @Param('postId', UuidValidationPipe) postId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SharePostDto,
  ) {
    return this.postsService.sharePost(postId, user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(VerifiedMemberGuard)
  @Post('reports')
  @ApiOperation({ summary: 'Report a post, comment, or photo (REP-01, GAL-14)' })
  createReport(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReportDto) {
    return this.postsService.createReport(user, dto);
  }

  @ApiBearerAuth()
  @Roles(ROLES.CHURCH_ADMIN, ROLES.GROUP_ADMIN, ROLES.PLATFORM_ADMIN)
  @Get('reports/queue')
  @ApiQuery({ name: 'status', enum: ReportStatus, required: false })
  @ApiOperation({ summary: 'View content reports queue (REP-02)' })
  getReportsQueue(@Query('status') status?: ReportStatus) {
    return this.postsService.getReportsQueue(status);
  }

  @ApiBearerAuth()
  @Roles(ROLES.CHURCH_ADMIN, ROLES.GROUP_ADMIN, ROLES.PLATFORM_ADMIN)
  @Patch('reports/:reportId')
  @ApiOperation({ summary: 'Dismiss, hide, or remove reported content (REP-02, REP-03)' })
  handleReport(
    @Param('reportId', UuidValidationPipe) reportId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: HandleReportDto,
  ) {
    return this.postsService.handleReport(reportId, actor, dto);
  }
}
