import { ResourceAccess, ResourceCategory, ResourceFormat, ResourceType } from '@prisma/client';
export declare class ResourceFileItemDto {
    fileUrl: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    isPreviewImage?: boolean;
}
export declare class CreateResourceDto {
    title: string;
    description: string;
    category: ResourceCategory;
    resourceType: ResourceType;
    format: ResourceFormat;
    access: ResourceAccess;
    price?: number;
    stock?: number;
    isChurchOwned?: boolean;
    files?: ResourceFileItemDto[];
}
export declare class UpdateResourceDto {
    title?: string;
    description?: string;
    category?: ResourceCategory;
    price?: number;
    stock?: number;
    files?: ResourceFileItemDto[];
}
export declare class ReviewResourceDto {
    decision: 'approve' | 'reject';
    reason?: string;
    category?: ResourceCategory;
}
