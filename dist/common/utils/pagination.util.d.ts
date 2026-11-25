export declare class PaginationQueryDto {
    page?: number;
    limit?: number;
}
export declare function buildPaginationMeta(total: number, page?: number, limit?: number): {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
};
