import type { Coupon } from "@/types/admin";

export type AccountReferralPayload = {
  coupon: {
    code: string;
    label: string;
    type: Coupon["type"];
    value: number;
    maxUsesPerUser?: number;
    usedCount: number;
    isActive: boolean;
  };
  shareUrl: string;
};
