export declare const ROLES: {
    readonly VISITOR: "VISITOR";
    readonly MEMBER: "MEMBER";
    readonly GROUP_ADMIN: "GROUP_ADMIN";
    readonly CHURCH_ADMIN: "CHURCH_ADMIN";
    readonly PLATFORM_ADMIN: "PLATFORM_ADMIN";
};
export type RoleName = (typeof ROLES)[keyof typeof ROLES];
export declare const DEFAULT_AVATAR_URL = "/assets/default-avatar.png";
export declare const UPLOAD_LIMITS: {
    IMAGE_MAX_BYTES: number;
    IMAGE_MAX_COUNT: number;
    VIDEO_MAX_BYTES: number;
    DOCUMENT_MAX_BYTES: number;
    ALLOWED_DOCUMENT_MIMES: string[];
};
export declare const REQUIRED_ACKNOWLEDGEMENTS = 10;
export declare const NIGERIAN_STATES_LGAS: Record<string, string[]>;
