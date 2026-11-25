import { Gender, ProfileVisibility } from '@prisma/client';
export declare class UpdateProfileDto {
    firstName?: string;
    middleName?: string;
    surname?: string;
    bio?: string;
    photoUrl?: string;
    gender?: Gender;
    dateOfBirth?: string;
    state?: string;
    lga?: string;
    residentialLocation?: string;
}
export declare class TogglePrivacyDto {
    profileVisibility: ProfileVisibility;
}
export declare class ChangeChurchDto {
    churchId: string;
}
export declare class SocialLinkDto {
    label: string;
    url: string;
}
export declare class SuspendMemberDto {
    reason: string;
}
