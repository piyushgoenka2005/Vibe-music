import type {
  RentalAvailabilityBlock,
  RentalInventoryLock,
  RentalProduct,
} from "@/types/rental";
import {
  eachDayBetween,
  rentalRangesOverlap,
} from "@/lib/rental/durationUtils";

export interface AvailabilityContext {
  product: RentalProduct;
  locks: RentalInventoryLock[];
  blocks: RentalAvailabilityBlock[];
  now?: string;
}

function activeLocks(locks: RentalInventoryLock[], now: string): RentalInventoryLock[] {
  return locks.filter((lock) => {
    if (lock.status === "released") return false;
    if (lock.status === "held" && lock.expiresAt) {
      return new Date(lock.expiresAt).getTime() > new Date(now).getTime();
    }
    return lock.status === "held" || lock.status === "confirmed";
  });
}

export function countAvailableUnits(
  ctx: AvailabilityContext,
  startAt: string,
  endAt: string
): number {
  const now = ctx.now ?? new Date().toISOString();
  const locks = activeLocks(ctx.locks, now);
  const total = Math.max(0, ctx.product.totalUnits);

  let unavailable = 0;

  for (const block of ctx.blocks) {
    if (rentalRangesOverlap(block.startAt, block.endAt, startAt, endAt)) {
      if (!block.unitId) {
        return 0;
      }
      unavailable += 1;
    }
  }

  for (const lock of locks) {
    if (rentalRangesOverlap(lock.startAt, lock.endAt, startAt, endAt)) {
      unavailable += 1;
    }
  }

  return Math.max(0, total - unavailable);
}

export function isProductAvailable(
  ctx: AvailabilityContext,
  startAt: string,
  endAt: string,
  quantity = 1
): boolean {
  if (ctx.product.status !== "active") return false;
  return countAvailableUnits(ctx, startAt, endAt) >= quantity;
}

export function buildAvailabilityCalendar(
  ctx: AvailabilityContext,
  fromDate: string,
  toDate: string
): Array<{ date: string; availableUnits: number; isBlocked: boolean }> {
  const start = new Date(`${fromDate}T00:00:00.000Z`);
  const end = new Date(`${toDate}T23:59:59.999Z`);
  const days: Array<{ date: string; availableUnits: number; isBlocked: boolean }> = [];

  const cursor = new Date(start);
  while (cursor <= end) {
    const dayStart = new Date(cursor);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(cursor);
    dayEnd.setUTCHours(23, 59, 59, 999);
    const date = dayStart.toISOString().slice(0, 10);
    const available = countAvailableUnits(
      ctx,
      dayStart.toISOString(),
      dayEnd.toISOString()
    );
    days.push({
      date,
      availableUnits: available,
      isBlocked: available === 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

export function summarizeBlockedDays(
  ctx: AvailabilityContext,
  startAt: string,
  endAt: string
): string[] {
  return eachDayBetween(startAt, endAt).filter((date) => {
    const dayStart = `${date}T00:00:00.000Z`;
    const dayEnd = `${date}T23:59:59.999Z`;
    return countAvailableUnits(ctx, dayStart, dayEnd) <= 0;
  });
}
