import { PrismaService } from '../../database/prisma.service';
export declare class RolesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    assignRoleToMember(memberId: string, roleName: string, assignedBy: string, scope?: {
        churchId?: string;
        groupId?: string;
    }): Promise<{
        churchId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        groupId: string | null;
        assignedBy: string | null;
        roleId: string;
        memberId: string;
    }>;
    revokeRoleFromMember(memberRoleId: string): Promise<{
        revoked: boolean;
        id: string;
    }>;
}
