import type {
  CouponValidationResult,
  ValidateCouponResponse,
} from "@/types/coupon";

export async function validateCouponCode(
  code: string,
  subtotal: number
): Promise<CouponValidationResult> {
  const response = await fetch("/api/coupons/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, subtotal }),
  });

  const data = (await response.json()) as ValidateCouponResponse & {
    error?: string;
  };

  if (!response.ok) {
    return (
      data.result ?? {
        valid: false,
        discount: 0,
        error: data.error ?? "Invalid coupon code",
      }
    );
  }

  return data.result;
}
