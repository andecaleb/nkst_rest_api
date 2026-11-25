import { VerificationPathway } from '@prisma/client';
export declare class SubmitVerificationRequestDto {
    pathway: VerificationPathway;
    programme?: string;
    completionDate?: string;
    evidenceText?: string;
    evidenceFileUrl?: string;
}
export declare class AcknowledgeMemberDto {
    note?: string;
}
export declare class ReviewVerificationDto {
    decisionNote?: string;
    completionDate?: string;
}
export declare class RejectVerificationDto {
    reason: string;
}
export declare class DirectValidateMemberDto {
    memberId: string;
    decisionNote?: string;
}
