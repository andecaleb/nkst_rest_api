import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IdentityService } from './identity.service';
import {
  AssignChurchAdminDto,
  CreateChurchDto,
  FilterChurchesDto,
  UpdateChurchDto,
} from './dto/church.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ROLES } from '../../common/constants/roles.constant';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';

@ApiTags('03 — Churches & Affiliation')
@Controller('churches')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Public()
  @Get('locations')
  @ApiOperation({ summary: 'List Nigerian states and LGAs for registration and church directory' })
  getLocations() {
    return this.identityService.getNigerianLocations();
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Browse and search NKST church directory (CHR-01)' })
  listChurches(@Query() query: FilterChurchesDto) {
    return this.identityService.listChurches(query);
  }

  @Public()
  @Get('map')
  @ApiQuery({ name: 'state', required: false })
  @ApiOperation({ summary: 'Get church geo-location pins for map view (CHR-08)' })
  getMapPins(@Query('state') state?: string) {
    return this.identityService.getChurchMapPins(state);
  }

  @Public()
  @Get(':churchId')
  @ApiOperation({ summary: 'Get church detail page with counts and previews (CHR-02)' })
  getChurchDetail(
    @Param('churchId', UuidValidationPipe) churchId: string,
    @CurrentUser() viewer?: AuthenticatedUser,
  ) {
    return this.identityService.getChurchDetail(churchId, viewer);
  }

  @ApiBearerAuth()
  @Roles(ROLES.PLATFORM_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a church record (Platform Admin — CHR-03)' })
  createChurch(@Body() dto: CreateChurchDto, @CurrentUser() user: AuthenticatedUser) {
    return this.identityService.createChurch(dto, user.id);
  }

  @ApiBearerAuth()
  @Roles(ROLES.CHURCH_ADMIN, ROLES.PLATFORM_ADMIN)
  @Patch(':churchId')
  @ApiOperation({ summary: 'Update church details (CHR-03, CHR-09)' })
  updateChurch(
    @Param('churchId', UuidValidationPipe) churchId: string,
    @Body() dto: UpdateChurchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.identityService.updateChurch(churchId, dto, user);
  }

  @ApiBearerAuth()
  @Roles(ROLES.PLATFORM_ADMIN)
  @Patch(':churchId/admin')
  @ApiOperation({ summary: 'Assign or replace sole Church Admin (Platform Admin — CHR-04)' })
  assignChurchAdmin(
    @Param('churchId', UuidValidationPipe) churchId: string,
    @Body() dto: AssignChurchAdminDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.identityService.assignChurchAdmin(churchId, dto, user.id);
  }

  @ApiBearerAuth()
  @Roles(ROLES.PLATFORM_ADMIN)
  @Patch(':churchId/deactivate')
  @ApiOperation({ summary: 'Mark a church inactive; blocks new registrations (CHR-07)' })
  deactivateChurch(
    @Param('churchId', UuidValidationPipe) churchId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.identityService.deactivateChurch(churchId, user.id);
  }
}
