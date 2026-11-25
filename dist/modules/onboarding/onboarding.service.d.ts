import { PrismaService } from '../../database/prisma.service';
import { AcknowledgeMemberDto, DirectValidateMemberDto, RejectVerificationDto, ReviewVerificationDto, SubmitVerificationRequestDto } from './dto/verification.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
export declare class OnboardingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMyVerificationStatus(user: AuthenticatedUser): Promise<{
        member: {
            churchId: string;
            id: string;
            verificationState: import(".prisma/client").$Enums.VerificationState;
            platformVerified: boolean;
        } | null;
        requests: {
            reviewer: {
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
            acknowledgementCount: number;
            acknowledgementsRequired: number;
            acknowledgementsProgress: string | null;
            acknowledgements: {
                id: string;
                note: string | null;
                createdAt: Date;
                acknowledger: {
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
            }[];
            church: {
                name: string;
                id: string;
            };
            churchId: string;
            id: string;
            status: import(".prisma/client").$Enums.VerificationRequestStatus;
            createdAt: Date;
            updatedAt: Date;
            memberId: string;
            pathway: import(".prisma/client").$Enums.VerificationPathway;
            evidenceText: string | null;
            evidenceFileUrl: string | null;
            programme: string | null;
            completionDate: Date | null;
            reviewerId: string | null;
            reviewedAt: Date | null;
            decisionNote: string | null;
        }[];
    }>;
    submitRequest(user: AuthenticatedUser, dto: SubmitVerificationRequestDto): Promise<{
        churchId: string;
        id: string;
        status: import(".prisma/client").$Enums.VerificationRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        memberId: string;
        pathway: import(".prisma/client").$Enums.VerificationPathway;
        evidenceText: string | null;
        evidenceFileUrl: string | null;
        programme: string | null;
        completionDate: Date | null;
        reviewerId: string | null;
        reviewedAt: Date | null;
        decisionNote: string | null;
    }>;
    acknowledgeRequest(requestId: string, user: AuthenticatedUser, dto: AcknowledgeMemberDto): Promise<{
        acknowledgement: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            note: string | null;
            requestId: string;
            acknowledgerId: string;
        };
        acknowledgementCount: number;
        required: number;
        readyForReview: boolean;
    }>;
    getVerificationQueue(actor: AuthenticatedUser, churchId?: string): Promise<{
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
        acknowledgementCount: number;
        church: {
            name: string;
            id: string;
        };
        _count: {
            acknowledgements: number;
        };
        churchId: string;
        id: string;
        status: import(".prisma/client").$Enums.VerificationRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        memberId: string;
        pathway: import(".prisma/client").$Enums.VerificationPathway;
        evidenceText: string | null;
        evidenceFileUrl: string | null;
        programme: string | null;
        completionDate: Date | null;
        reviewerId: string | null;
        reviewedAt: Date | null;
        decisionNote: string | null;
    }[]>;
    approveRequest(requestId: string, actor: AuthenticatedUser, dto: ReviewVerificationDto): Promise<{
        request: {
            churchId: string;
            id: string;
            status: import(".prisma/client").$Enums.VerificationRequestStatus;
            createdAt: Date;
            updatedAt: Date;
            memberId: string;
            pathway: import(".prisma/client").$Enums.VerificationPathway;
            evidenceText: string | null;
            evidenceFileUrl: string | null;
            programme: string | null;
            completionDate: Date | null;
            reviewerId: string | null;
            reviewedAt: Date | null;
            decisionNote: string | null;
        };
        releasedHeldContent: {
            postsReleasedToReview: any;
            photosReleasedToReview: any;
            resourcesReleasedToReview: any;
            commentsMadeVisible: any;
            groupJoinRequestsReleased: any;
        };
    }>;
    rejectRequest(requestId: string, actor: AuthenticatedUser, dto: RejectVerificationDto): Promise<{
        churchId: string;
        id: string;
        status: import(".prisma/client").$Enums.VerificationRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        memberId: string;
        pathway: import(".prisma/client").$Enums.VerificationPathway;
        evidenceText: string | null;
        evidenceFileUrl: string | null;
        programme: string | null;
        completionDate: Date | null;
        reviewerId: string | null;
        reviewedAt: Date | null;
        decisionNote: string | null;
    }>;
    directValidate(actor: AuthenticatedUser, dto: DirectValidateMemberDto): Promise<{
        request: {
            churchId: string;
            id: string;
            status: import(".prisma/client").$Enums.VerificationRequestStatus;
            createdAt: Date;
            updatedAt: Date;
            memberId: string;
            pathway: import(".prisma/client").$Enums.VerificationPathway;
            evidenceText: string | null;
            evidenceFileUrl: string | null;
            programme: string | null;
            completionDate: Date | null;
            reviewerId: string | null;
            reviewedAt: Date | null;
            decisionNote: string | null;
        };
        releasedHeldContent: {
            postsReleasedToReview: any;
            photosReleasedToReview: any;
            resourcesReleasedToReview: any;
            commentsMadeVisible: any;
            groupJoinRequestsReleased: any;
        };
    }>;
    private releaseHeldContentTx;
    private assertCanReviewChurch;
}
