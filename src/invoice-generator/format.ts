/** Format amount in Indian Rupees (₹) with en-IN grouping. */
export function formatPrice(amount: number): string {
  const hasPaise = Math.round(amount * 100) % 100 !== 0;
  return `₹ ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export const formatRupeePrice = formatPrice;
