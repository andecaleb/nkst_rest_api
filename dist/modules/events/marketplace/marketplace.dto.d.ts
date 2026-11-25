import { SellerPlan } from '@prisma/client';
export declare class GrantSellerAccessDto {
    memberId: string;
    plan: SellerPlan;
}
export declare class RevokeSellerAccessDto {
    reason: string;
}
export declare class HideListingDto {
    reason: string;
}
export declare class CreateOrderDto {
    resourceId: string;
    quantity?: number;
}
export declare class DeclineOrderDto {
    reason: string;
}
export declare class CancelOrderDto {
    reason?: string;
}
export declare class OrderMessageDto {
    body: string;
}
