import { GenderRestriction, GroupJoinMode, GroupScope, GroupVisibility } from '@prisma/client';
export declare class CreateGroupDto {
    name: string;
    description: string;
    coverUrl?: string;
    scope: GroupScope;
    churchId?: string;
    visibility: GroupVisibility;
    joinMode: GroupJoinMode;
    genderRestriction?: GenderRestriction;
    minAge?: number;
    maxAge?: number;
    verifiedOnly?: boolean;
    allowedChurchIds?: string[];
}
export declare class DecideJoinRequestDto {
    decision: 'approve' | 'reject';
    reason?: string;
}
export declare class InviteMemberDto {
    memberId: string;
}
