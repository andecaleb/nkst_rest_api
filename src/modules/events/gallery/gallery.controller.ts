import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PhotoCategory } from '@prisma/client';
import { GalleryService } from './gallery.service';
import { CreateAlbumDto, ReviewPhotoDto, UploadPhotoDto } from './gallery.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ROLES } from '../../../common/constants/roles.constant';
import { AuthenticatedUser, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { NotSuspendedGuard } from '../../../common/guards/not-suspended.guard';
import { UuidValidationPipe } from '../../../common/pipes/uuid-validation.pipe';

@ApiTags('07 — Church Galleries')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Public()
  @Get('churches/:churchId/albums')
  @ApiOperation({ summary: 'List albums in a church gallery (GAL-01)' })
  listAlbums(@Param('churchId', UuidValidationPipe) churchId: string) {
    return this.galleryService.listAlbums(churchId);
  }

  @ApiBearerAuth()
  @Roles(ROLES.CHURCH_ADMIN, ROLES.PLATFORM_ADMIN)
  @Post('churches/:churchId/albums')
  @ApiOperation({ summary: 'Create a gallery album (Church Admin — GAL-02)' })
  createAlbum(
    @Param('churchId', UuidValidationPipe) churchId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateAlbumDto,
  ) {
    return this.galleryService.createAlbum(churchId, actor, dto);
  }

  @Public()
  @Get('photos')
  @ApiQuery({ name: 'churchId', required: false })
  @ApiQuery({ name: 'category', enum: PhotoCategory, required: false })
  @ApiQuery({ name: 'albumId', required: false })
  @ApiQuery({ name: 'eventName', required: false })
  @ApiQuery({ name: 'uploaderId', required: false })
  @ApiOperation({ summary: 'Browse approved photos across all churches or one church (GAL-06, GAL-07)' })
  listPhotos(
    @Query('churchId') churchId?: string,
    @Query('category') category?: PhotoCategory,
    @Query('albumId') albumId?: string,
    @Query('eventName') eventName?: string,
    @Query('uploaderId') uploaderId?: string,
    @CurrentUser() viewer?: AuthenticatedUser,
  ) {
    return this.galleryService.listPhotos(
      { churchId, category, albumId, eventName, uploaderId },
      viewer,
    );
  }

  @ApiBearerAuth()
  @UseGuards(NotSuspendedGuard)
  @Post('photos')
  @ApiOperation({ summary: 'Upload photo with consent & minors safeguarding flags (GAL-03, GAL-11, GAL-12)' })
  uploadPhoto(@CurrentUser() user: AuthenticatedUser, @Body() dto: UploadPhotoDto) {
    return this.galleryService.uploadPhoto(user, dto);
  }

  @ApiBearerAuth()
  @Roles(ROLES.CHURCH_ADMIN, ROLES.PLATFORM_ADMIN)
  @Get('review-queue')
  @ApiOperation({ summary: 'View photo review queue with minors safeguarding flag (GAL-04, GAL-12)' })
  getReviewQueue(@CurrentUser() actor: AuthenticatedUser) {
    return this.galleryService.getReviewQueue(actor);
  }

  @ApiBearerAuth()
  @Roles(ROLES.CHURCH_ADMIN, ROLES.PLATFORM_ADMIN)
  @Patch('photos/:photoId/review')
  @ApiOperation({ summary: 'Approve, reject, or move a gallery photo (Church Admin — GAL-04)' })
  reviewPhoto(
    @Param('photoId', UuidValidationPipe) photoId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: ReviewPhotoDto,
  ) {
    return this.galleryService.reviewPhoto(photoId, actor, dto);
  }
}
