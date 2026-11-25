import { AuditService } from './audit.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    getCounts(actor: AuthenticatedUser): Promise<{
        totalChurches: number;
        openReports: number;
        membersByVerificationState: {
            verificationState: import(".prisma/client").$Enums.VerificationState;
            count: number;
        }[];
        membersByState: {
            state: string;
            count: number;
        }[];
        membersByChurch: {
            churchId: string;
            count: number;
        }[];
    }>;
    listLogs(limit?: number): Promise<({
        actor: {
            firstName: string;
            surname: string;
            email: string;
            id: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        ipAddress: string | null;
        action: string;
        entityType: string;
        entityId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        actorId: string | null;
    })[]>;
    listModerationActions(limit?: number): Promise<({
        moderator: {
            firstName: string;
            surname: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        action: import(".prisma/client").$Enums.ModerationActionType;
        reason: string | null;
        subjectType: import(".prisma/client").$Enums.ModerationSubjectType;
        subjectId: string;
        moderatorId: string;
    })[]>;
}
