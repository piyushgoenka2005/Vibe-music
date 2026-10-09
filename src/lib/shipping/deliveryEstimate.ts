export type DeliveryEstimate = {
  dateLabel: string;
  orderWindow: string;
};

/** Next delivery date after five IST business days (Mon–Sat), excluding Sunday. */
export function getDeliveryEstimate(now = new Date()): DeliveryEstimate {
  const delivery = new Date(now);
  let businessDays = 0;

  while (businessDays < 5) {
    delivery.setDate(delivery.getDate() + 1);
    const day = delivery.getDay();
    if (day !== 0 && day !== 6) businessDays += 1;
  }

  const dateLabel = delivery.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  });

  const cutoff = new Date(now);
  cutoff.setHours(18, 0, 0, 0);

  let orderWindow = "today";
  if (now < cutoff) {
    const diffMs = cutoff.getTime() - now.getTime();
    const hours = Math.floor(diffMs / 3_600_000);
    const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
    orderWindow = `${hours} hrs ${minutes} mins`;
  }

  return { dateLabel, orderWindow };
}

export function formatFreeDeliveryLine(estimate: DeliveryEstimate): string {
  return `FREE delivery ${estimate.dateLabel}`;
}
