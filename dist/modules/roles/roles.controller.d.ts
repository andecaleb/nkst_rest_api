import { RolesService } from './roles.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
declare class AssignRoleDto {
    roleName: string;
    churchId?: string;
    groupId?: string;
}
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    listRoles(): Promise<({
        permissions: ({
            permission: {
                description: string | null;
                code: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    listPermissions(): Promise<{
        description: string | null;
        code: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getMemberRoles(memberId: string): Promise<({
        role: {
            permissions: ({
                permission: {
                    description: string | null;
                    code: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                createdAt: Date;
                roleId: string;
                permissionId: string;
            })[];
        } & {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        churchId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        groupId: string | null;
        assignedBy: string | null;
        roleId: string;
        memberId: string;
    })[]>;
    assignRole(memberId: string, dto: AssignRoleDto, user: AuthenticatedUser): Promise<{
        churchId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        groupId: string | null;
        assignedBy: string | null;
        roleId: string;
        memberId: string;
    }>;
    revokeRole(memberRoleId: string): Promise<{
        revoked: boolean;
        id: string;
    }>;
}
export {};
