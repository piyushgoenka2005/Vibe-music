import type { RentalDurationType } from "@/types/rental";

const MS_HOUR = 60 * 60 * 1000;
const MS_DAY = 24 * MS_HOUR;

export function parseRentalInstant(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid rental date");
  }
  return date;
}

export function rentalRangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  const startA = parseRentalInstant(aStart).getTime();
  const endA = parseRentalInstant(aEnd).getTime();
  const startB = parseRentalInstant(bStart).getTime();
  const endB = parseRentalInstant(bEnd).getTime();
  return startA < endB && startB < endA;
}

export function computeDurationUnits(
  durationType: RentalDurationType,
  startAt: string,
  endAt: string
): number {
  const start = parseRentalInstant(startAt).getTime();
  const end = parseRentalInstant(endAt).getTime();
  if (end <= start) {
    throw new Error("End time must be after start time");
  }

  const diffMs = end - start;

  switch (durationType) {
    case "hourly":
      return Math.max(1, Math.ceil(diffMs / MS_HOUR));
    case "daily":
      return Math.max(1, Math.ceil(diffMs / MS_DAY));
    case "weekly":
      return Math.max(1, Math.ceil(diffMs / (7 * MS_DAY)));
    case "monthly":
      return Math.max(1, Math.ceil(diffMs / (30 * MS_DAY)));
    default:
      throw new Error("Unsupported duration type");
  }
}

export function validateDurationBounds(input: {
  durationType: RentalDurationType;
  startAt: string;
  endAt: string;
  minDurationHours: number;
  maxDurationDays: number;
}): void {
  const start = parseRentalInstant(input.startAt).getTime();
  const end = parseRentalInstant(input.endAt).getTime();
  const diffHours = (end - start) / MS_HOUR;
  const diffDays = diffHours / 24;

  if (diffHours < input.minDurationHours) {
    throw new Error(
      `Minimum rental duration is ${input.minDurationHours} hour(s)`
    );
  }

  if (diffDays > input.maxDurationDays) {
    throw new Error(
      `Maximum rental duration is ${input.maxDurationDays} day(s)`
    );
  }
}

export function inferBestDurationType(
  startAt: string,
  endAt: string
): RentalDurationType {
  const hours = (parseRentalInstant(endAt).getTime() - parseRentalInstant(startAt).getTime()) / MS_HOUR;
  if (hours <= 48) return "hourly";
  if (hours <= 14 * 24) return "daily";
  if (hours <= 60 * 24) return "weekly";
  return "monthly";
}

export function formatRentalDateRange(startAt: string, endAt: string): string {
  const fmt = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
  return `${fmt.format(parseRentalInstant(startAt))} → ${fmt.format(parseRentalInstant(endAt))}`;
}

export function eachDayBetween(startAt: string, endAt: string): string[] {
  const days: string[] = [];
  const cursor = new Date(parseRentalInstant(startAt));
  cursor.setUTCHours(0, 0, 0, 0);
  const end = parseRentalInstant(endAt).getTime();

  while (cursor.getTime() <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}
