import { ChurchStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/utils/pagination.util';
export declare class CreateChurchDto {
    name: string;
    state: string;
    lga: string;
    town: string;
    address: string;
    landmark?: string;
    phones: string[];
    email?: string;
    latitude?: number;
    longitude?: number;
    photoUrl?: string;
}
export declare class UpdateChurchDto {
    name?: string;
    state?: string;
    lga?: string;
    town?: string;
    address?: string;
    landmark?: string;
    phones?: string[];
    email?: string;
    latitude?: number;
    longitude?: number;
    photoUrl?: string;
    status?: ChurchStatus;
}
export declare class AssignChurchAdminDto {
    memberId: string;
}
export declare class FilterChurchesDto extends PaginationQueryDto {
    search?: string;
    state?: string;
    lga?: string;
    town?: string;
    status?: ChurchStatus;
}
