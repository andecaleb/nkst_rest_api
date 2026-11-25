import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  ResourceAccess,
  ResourceCategory,
  ResourceFormat,
  ResourceType,
} from '@prisma/client';
import { ResourcesService } from './resources.service';
import { CreateResourceDto, ReviewResourceDto, UpdateResourceDto } from './resources.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ROLES } from '../../../common/constants/roles.constant';
import { AuthenticatedUser, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { NotSuspendedGuard } from '../../../common/guards/not-suspended.guard';
import { UuidValidationPipe } from '../../../common/pipes/uuid-validation.pipe';

@ApiTags('08 — Resources & Central Library')
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Public()
  @Get('library')
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'churchId', required: false })
  @ApiQuery({ name: 'category', enum: ResourceCategory, required: false })
  @ApiQuery({ name: 'resourceType', enum: ResourceType, required: false })
  @ApiQuery({ name: 'access', enum: ResourceAccess, required: false })
  @ApiQuery({ name: 'format', enum: ResourceFormat, required: false })
  @ApiQuery({ name: 'ownerId', required: false })
  @ApiQuery({ name: 'inStock', type: Boolean, required: false })
  @ApiOperation({ summary: 'Browse and search approved resources in the Central Library (RES-09, RES-10)' })
  browseCentralLibrary(
    @Query('search') search?: string,
    @Query('churchId') churchId?: string,
    @Query('category') category?: ResourceCategory,
    @Query('resourceType') resourceType?: ResourceType,
    @Query('access') access?: ResourceAccess,
    @Query('format') format?: ResourceFormat,
    @Query('ownerId') ownerId?: string,
    @Query('inStock') inStock?: boolean,
    @CurrentUser() viewer?: AuthenticatedUser,
  ) {
    return this.resourcesService.browseCentralLibrary(
      { search, churchId, category, resourceType, access, format, ownerId, inStock },
      viewer,
    );
  }

  @ApiBearerAuth()
  @Get('my-library')
  @ApiOperation({ summary: 'View personal library (My Library) with resource statuses (RES-01)' })
  getMyLibrary(@CurrentUser() user: AuthenticatedUser) {
    return this.resourcesService.getMyLibrary(user);
  }

  @ApiBearerAuth()
  @UseGuards(NotSuspendedGuard)
  @Post()
  @ApiOperation({ summary: 'Create a resource (free/paid, digital/hard copy — RES-02, RES-03)' })
  createResource(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateResourceDto) {
    return this.resourcesService.createResource(user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(NotSuspendedGuard)
  @Patch(':resourceId')
  @ApiOperation({ summary: 'Edit own resource; file/price edits trigger re-review (RES-14)' })
  updateResource(
    @Param('resourceId', UuidValidationPipe) resourceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.resourcesService.updateResource(resourceId, user, dto);
  }

  @ApiBearerAuth()
  @Patch(':resourceId/submit')
  @ApiOperation({ summary: 'Submit a personal resource to the church collection (RES-04)' })
  submitToChurch(
    @Param('resourceId', UuidValidationPipe) resourceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resourcesService.submitToChurch(resourceId, user);
  }

  @ApiBearerAuth()
  @Patch(':resourceId/archive')
  @ApiOperation({ summary: 'Archive/withdraw own resource from circulation (RES-07)' })
  archiveResource(
    @Param('resourceId', UuidValidationPipe) resourceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resourcesService.archiveResource(resourceId, user);
  }

  @ApiBearerAuth()
  @Get(':resourceId/download')
  @ApiOperation({ summary: 'Access digital resource files (free for verified; paid after order accepted — RES-11, RES-12)' })
  downloadFiles(
    @Param('resourceId', UuidValidationPipe) resourceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resourcesService.getResourceDownloadFiles(resourceId, user);
  }

  @ApiBearerAuth()
  @Roles(ROLES.CHURCH_ADMIN, ROLES.PLATFORM_ADMIN)
  @Get('review-queue')
  @ApiOperation({ summary: 'View church resource review queue (RES-05)' })
  getReviewQueue(@CurrentUser() actor: AuthenticatedUser) {
    return this.resourcesService.getReviewQueue(actor);
  }

  @ApiBearerAuth()
  @Roles(ROLES.CHURCH_ADMIN, ROLES.PLATFORM_ADMIN)
  @Patch(':resourceId/review')
  @ApiOperation({ summary: 'Approve or reject a submitted resource (Church Admin — RES-05)' })
  reviewResource(
    @Param('resourceId', UuidValidationPipe) resourceId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: ReviewResourceDto,
  ) {
    return this.resourcesService.reviewResource(resourceId, actor, dto);
  }
}
