import type { RentalDurationType, RentalProduct } from "@/types/rental";
import { computeDurationUnits } from "@/lib/rental/durationUtils";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getUnitRate(
  product: Pick<
    RentalProduct,
    "hourlyRate" | "dailyRate" | "weeklyRate" | "monthlyRate"
  >,
  durationType: RentalDurationType
): number {
  switch (durationType) {
    case "hourly":
      return product.hourlyRate;
    case "daily":
      return product.dailyRate;
    case "weekly":
      return product.weeklyRate;
    case "monthly":
      return product.monthlyRate;
    default:
      return 0;
  }
}

export function calculateRentalLine(input: {
  product: RentalProduct;
  quantity: number;
  durationType: RentalDurationType;
  startAt: string;
  endAt: string;
  fulfillment: "pickup" | "delivery";
}): {
  durationUnits: number;
  unitRate: number;
  lineSubtotal: number;
  depositAmount: number;
  deliveryFee: number;
  pickupFee: number;
} {
  const quantity = Math.max(1, input.quantity);
  const durationUnits = computeDurationUnits(
    input.durationType,
    input.startAt,
    input.endAt
  );
  const unitRate = getUnitRate(input.product, input.durationType);

  if (unitRate <= 0) {
    throw new Error(`No ${input.durationType} rate configured for this item`);
  }

  const lineSubtotal = round2(unitRate * durationUnits * quantity);
  const depositAmount = round2(input.product.depositAmount * quantity);
  const deliveryFee =
    input.fulfillment === "delivery" && input.product.deliveryAvailable
      ? round2(input.product.deliveryFee)
      : 0;
  const pickupFee =
    input.fulfillment === "pickup" && input.product.pickupAvailable
      ? round2(input.product.pickupFee)
      : 0;

  return {
    durationUnits,
    unitRate,
    lineSubtotal,
    depositAmount,
    deliveryFee,
    pickupFee,
  };
}

export function calculateRentalTotals(input: {
  lines: Array<{
    lineSubtotal: number;
    depositAmount: number;
    deliveryFee: number;
    pickupFee: number;
  }>;
  gstRate?: number;
}): {
  subtotal: number;
  depositAmount: number;
  deliveryFee: number;
  pickupFee: number;
  totalGst: number;
  total: number;
} {
  const subtotal = round2(
    input.lines.reduce((sum, line) => sum + line.lineSubtotal, 0)
  );
  const depositAmount = round2(
    input.lines.reduce((sum, line) => sum + line.depositAmount, 0)
  );
  const deliveryFee = round2(
    input.lines.reduce((sum, line) => sum + line.deliveryFee, 0)
  );
  const pickupFee = round2(
    input.lines.reduce((sum, line) => sum + line.pickupFee, 0)
  );
  const taxable = subtotal + deliveryFee + pickupFee;
  const gstRate = input.gstRate ?? 18;
  const totalGst = round2((taxable * gstRate) / (100 + gstRate));
  const total = round2(taxable + depositAmount);

  return {
    subtotal,
    depositAmount,
    deliveryFee,
    pickupFee,
    totalGst,
    total,
  };
}

export function calculateLateFee(input: {
  lateFeePerDay: number;
  dueAt: string;
  returnedAt: string;
}): number {
  const due = new Date(input.dueAt).getTime();
  const returned = new Date(input.returnedAt).getTime();
  if (returned <= due || input.lateFeePerDay <= 0) return 0;
  const daysLate = Math.ceil((returned - due) / (24 * 60 * 60 * 1000));
  return round2(daysLate * input.lateFeePerDay);
}
