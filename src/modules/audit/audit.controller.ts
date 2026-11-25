import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { ROLES } from '../../common/constants/roles.constant';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('12 — Admin Counts & Audit Trail')
@ApiBearerAuth()
@Roles(ROLES.CHURCH_ADMIN, ROLES.PLATFORM_ADMIN)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('counts')
  @ApiOperation({ summary: 'Basic admin counts: members by church, state, and verification state (Phase 6)' })
  getCounts(@CurrentUser() actor: AuthenticatedUser) {
    return this.auditService.getAdminCounts(actor);
  }

  @Roles(ROLES.PLATFORM_ADMIN)
  @Get('logs')
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiOperation({ summary: 'List recent admin audit logs (Platform Admin)' })
  listLogs(@Query('limit') limit?: number) {
    return this.auditService.listAuditLogs(limit ? Number(limit) : 50);
  }

  @Get('moderation-actions')
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiOperation({ summary: 'List recent moderation actions across posts, photos, and resources' })
  listModerationActions(@Query('limit') limit?: number) {
    return this.auditService.listModerationHistory(limit ? Number(limit) : 50);
  }
}
