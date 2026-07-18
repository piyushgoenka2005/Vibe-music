import type { CartPromotionsPublic } from "@/lib/cart/cartPromotions";
import {
  isFreeGiftUnlocked,
  isFreeShippingUnlocked,
} from "@/lib/cart/promoGift";
import { formatDisplayPrice } from "@/utils/currency";

export type CartMilestoneIcon = "shipping" | "gift";

export interface CartMilestone {
  id: string;
  label: string;
  shortLabel: string;
  threshold: number;
  icon: CartMilestoneIcon;
  unlocked: boolean;
}

export interface CartMilestoneState {
  milestones: CartMilestone[];
  progressRatio: number;
  statusMessage: string;
  nextMilestone: CartMilestone | null;
  targetThreshold: number;
}

export function buildCartMilestoneState(
  paidSubtotal: number,
  config: CartPromotionsPublic | null
): CartMilestoneState {
  const freeShippingThreshold = config?.freeShippingThreshold ?? 400;
  const freeGiftThreshold = config?.freeGiftThreshold ?? 799;
  const giftConfigured = Boolean(config?.giftProductId);

  const shippingUnlocked = isFreeShippingUnlocked(
    paidSubtotal,
    freeShippingThreshold
  );
  const giftUnlocked = isFreeGiftUnlocked(
    paidSubtotal,
    freeGiftThreshold,
    giftConfigured
  );

  const milestones: CartMilestone[] = [
    {
      id: "free-shipping",
      label: "Free shipping",
      shortLabel: "Shipping",
      threshold: freeShippingThreshold,
      icon: "shipping",
      unlocked: shippingUnlocked,
    },
  ];

  if (giftConfigured) {
    milestones.push({
      id: "free-gift",
      label: "Free gift",
      shortLabel: "Gift",
      threshold: freeGiftThreshold,
      icon: "gift",
      unlocked: giftUnlocked,
    });
  }

  const targetThreshold = giftConfigured
    ? freeGiftThreshold
    : freeShippingThreshold;

  const nextMilestone =
    milestones.find((milestone) => !milestone.unlocked) ?? null;

  const progressRatio =
    targetThreshold <= 0
      ? 1
      : Math.min(1, paidSubtotal / targetThreshold);

  let statusMessage = "Add items to unlock rewards";
  if (nextMilestone) {
    const remaining = Math.max(0, nextMilestone.threshold - paidSubtotal);
    statusMessage = `Add ${formatDisplayPrice(remaining)} more to unlock ${nextMilestone.label.toLowerCase()}`;
  } else if (milestones.every((milestone) => milestone.unlocked)) {
    statusMessage = "All rewards unlocked for this order";
  }

  return {
    milestones,
    progressRatio,
    statusMessage,
    nextMilestone,
    targetThreshold,
  };
}

export function milestoneMarkerPosition(
  milestoneThreshold: number,
  targetThreshold: number
): number {
  if (targetThreshold <= 0) return 100;
  return Math.min(100, (milestoneThreshold / targetThreshold) * 100);
}
