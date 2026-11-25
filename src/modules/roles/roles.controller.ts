import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { RolesService } from './roles.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { ROLES } from '../../common/constants/roles.constant';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';

class AssignRoleDto {
  @ApiProperty({ example: 'CHURCH_ADMIN' })
  @IsString()
  roleName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  churchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  groupId?: string;
}

@ApiTags('01 — Roles & Permissions')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'List all functional roles and their permissions' })
  listRoles() {
    return this.rolesService.listRoles();
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List all seeded permissions' })
  listPermissions() {
    return this.rolesService.listPermissions();
  }

  @Get('member/:memberId')
  @Roles(ROLES.CHURCH_ADMIN, ROLES.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get role assignments for a member' })
  getMemberRoles(@Param('memberId', UuidValidationPipe) memberId: string) {
    return this.rolesService.getMemberRoles(memberId);
  }

  @Post('member/:memberId')
  @Roles(ROLES.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Assign a functional role to a member (Platform Admin)' })
  assignRole(
    @Param('memberId', UuidValidationPipe) memberId: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rolesService.assignRoleToMember(memberId, dto.roleName, user.id, {
      churchId: dto.churchId,
      groupId: dto.groupId,
    });
  }

  @Delete('assignment/:memberRoleId')
  @Roles(ROLES.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Revoke a member role assignment (Platform Admin)' })
  revokeRole(@Param('memberRoleId', UuidValidationPipe) memberRoleId: string) {
    return this.rolesService.revokeRoleFromMember(memberRoleId);
  }
}
