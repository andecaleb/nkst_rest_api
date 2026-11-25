import { ProfileVisibility, VerificationState } from '@prisma/client';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
export interface MemberLike {
    id: string;
    firstName: string;
    middleName?: string | null;
    surname: string;
    email?: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: Date;
    photoUrl?: string | null;
    bio?: string | null;
    state?: string;
    lga?: string;
    residentialLocation?: string;
    churchId: string;
    verificationState: VerificationState;
    profileVisibility: ProfileVisibility;
    isPlatformAdmin?: boolean;
    church?: {
        id: string;
        name: string;
        state?: string;
        lga?: string;
    } | null;
    socialLinks?: Array<{
        id: string;
        label: string;
        url: string;
    }>;
    [key: string]: any;
}
export declare function serializeMember(member: MemberLike | null | undefined, viewer?: AuthenticatedUser): {
    id: string;
    firstName: string;
    middleName: string | null;
    surname: string;
    fullName: string;
    churchId: string;
    church: {
        id: string;
        name: string;
        state?: string;
        lga?: string;
    } | undefined;
    verificationState: import(".prisma/client").$Enums.VerificationState;
    isVerified: boolean;
    verificationBadge: string;
    profileVisibility: import(".prisma/client").$Enums.ProfileVisibility;
    photoUrl: string;
    bio: string | null;
    gender: string | undefined;
    state: string | undefined;
    lga: string | undefined;
} | {
    email: string | undefined;
    phone: string | undefined;
    dateOfBirth: Date | undefined;
    residentialLocation: string | undefined;
    socialLinks: {
        id: string;
        label: string;
        url: string;
    }[] | undefined;
    isPlatformAdmin: boolean | undefined;
    suspensionReason: any;
    id: string;
    firstName: string;
    middleName: string | null;
    surname: string;
    fullName: string;
    churchId: string;
    church: {
        id: string;
        name: string;
        state?: string;
        lga?: string;
    } | undefined;
    verificationState: import(".prisma/client").$Enums.VerificationState;
    isVerified: boolean;
    verificationBadge: string;
    profileVisibility: import(".prisma/client").$Enums.ProfileVisibility;
    photoUrl: string;
    bio: string | null;
    gender: string | undefined;
    state: string | undefined;
    lga: string | undefined;
} | null;
export declare function serializeMemberCard(member: MemberLike | null | undefined, viewer?: AuthenticatedUser): {
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
export declare function calculateAge(dateOfBirth: Date): number;
