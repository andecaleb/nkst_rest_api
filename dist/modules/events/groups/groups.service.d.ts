import { GroupScope, GroupVisibility } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateGroupDto, DecideJoinRequestDto } from './groups.dto';
import { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
export declare class GroupsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createGroup(actor: AuthenticatedUser, dto: CreateGroupDto): Promise<{
        members: {
            role: import(".prisma/client").$Enums.GroupMemberRole;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            groupId: string;
            memberId: string;
            joinedAt: Date;
        }[];
        allowedChurches: {
            churchId: string;
            id: string;
            createdAt: Date;
            groupId: string;
        }[];
    } & {
        name: string;
        description: string;
        churchId: string | null;
        id: string;
        status: import(".prisma/client").$Enums.GroupStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        maxAge: number | null;
        coverUrl: string | null;
        scope: import(".prisma/client").$Enums.GroupScope;
        visibility: import(".prisma/client").$Enums.GroupVisibility;
        joinMode: import(".prisma/client").$Enums.GroupJoinMode;
        genderRestriction: import(".prisma/client").$Enums.GenderRestriction;
        minAge: number | null;
        verifiedOnly: boolean;
        createdById: string;
    }>;
    listGroups(filters: {
        search?: string;
        churchId?: string;
        scope?: GroupScope;
        visibility?: GroupVisibility;
    }): Promise<({
        church: {
            name: string;
            id: string;
        } | null;
        _count: {
            members: number;
        };
        allowedChurches: {
            churchId: string;
        }[];
    } & {
        name: string;
        description: string;
        churchId: string | null;
        id: string;
        status: import(".prisma/client").$Enums.GroupStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        maxAge: number | null;
        coverUrl: string | null;
        scope: import(".prisma/client").$Enums.GroupScope;
        visibility: import(".prisma/client").$Enums.GroupVisibility;
        joinMode: import(".prisma/client").$Enums.GroupJoinMode;
        genderRestriction: import(".prisma/client").$Enums.GenderRestriction;
        minAge: number | null;
        verifiedOnly: boolean;
        createdById: string;
    })[]>;
    joinOrRequestGroup(groupId: string, user: AuthenticatedUser): Promise<{
        joined: boolean;
        status: import(".prisma/client").$Enums.GroupJoinRequestStatus;
        message: string;
        request: {
            id: string;
            status: import(".prisma/client").$Enums.GroupJoinRequestStatus;
            createdAt: Date;
            updatedAt: Date;
            groupId: string;
            memberId: string;
            reason: string | null;
            decidedAt: Date | null;
            invitedById: string | null;
            decidedById: string | null;
        };
        membership?: undefined;
    } | {
        joined: boolean;
        membership: {
            role: import(".prisma/client").$Enums.GroupMemberRole;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            groupId: string;
            memberId: string;
            joinedAt: Date;
        };
        status?: undefined;
        message?: undefined;
        request?: undefined;
    } | {
        joined: boolean;
        status: import(".prisma/client").$Enums.GroupJoinRequestStatus;
        request: {
            id: string;
            status: import(".prisma/client").$Enums.GroupJoinRequestStatus;
            createdAt: Date;
            updatedAt: Date;
            groupId: string;
            memberId: string;
            reason: string | null;
            decidedAt: Date | null;
            invitedById: string | null;
            decidedById: string | null;
        };
        message?: undefined;
        membership?: undefined;
    }>;
    listJoinRequests(groupId: string, actor: AuthenticatedUser): Promise<{
        member: {
            id: string;
            fullName: string;
            photoUrl: string;
            churchId: string;
            church: {
                id: string;
                name: string;
                state?: string;
                lga?: string;
            } | undefined;
            isVerified: boolean;
            verificationBadge: string;
            profileVisibility: import(".prisma/client").$Enums.ProfileVisibility;
        } | null;
        id: string;
        status: import(".prisma/client").$Enums.GroupJoinRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        groupId: string;
        memberId: string;
        reason: string | null;
        decidedAt: Date | null;
        invitedById: string | null;
        decidedById: string | null;
    }[]>;
    decideJoinRequest(groupId: string, requestId: string, actor: AuthenticatedUser, dto: DecideJoinRequestDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.GroupJoinRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        groupId: string;
        memberId: string;
        reason: string | null;
        decidedAt: Date | null;
        invitedById: string | null;
        decidedById: string | null;
    }>;
    inviteMember(groupId: string, targetMemberId: string, actor: AuthenticatedUser): Promise<{
        role: import(".prisma/client").$Enums.GroupMemberRole;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        groupId: string;
        memberId: string;
        joinedAt: Date;
    }>;
    promoteToGroupAdmin(groupId: string, targetMemberId: string, actor: AuthenticatedUser): Promise<{
        role: import(".prisma/client").$Enums.GroupMemberRole;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        groupId: string;
        memberId: string;
        joinedAt: Date;
    }>;
    removeMember(groupId: string, targetMemberId: string, actor: AuthenticatedUser): Promise<{
        removed: boolean;
        groupId: string;
        memberId: string;
    }>;
    leaveGroup(groupId: string, user: AuthenticatedUser): Promise<{
        left: boolean;
        groupId: string;
    }>;
    listGroupMembers(groupId: string, viewer?: AuthenticatedUser): Promise<{
        role: import(".prisma/client").$Enums.GroupMemberRole;
        joinedAt: Date;
        member: {
            id: string;
            fullName: string;
            photoUrl: string;
            churchId: string;
            church: {
                id: string;
                name: string;
                state?: string;
                lga?: string;
            } | undefined;
            isVerified: boolean;
            verificationBadge: string;
            profileVisibility: import(".prisma/client").$Enums.ProfileVisibility;
        } | null;
    }[]>;
    private assertMemberEligible;
    private assertGroupAdmin;
}
