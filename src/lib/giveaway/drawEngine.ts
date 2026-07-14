import { randomInt } from "node:crypto";
import type { GiveawayEntry } from "@/types/giveaway";

export interface DrawCandidate {
  entryId: string;
  tickets: number;
}

export function buildDrawPool(
  entries: Pick<GiveawayEntry, "id" | "totalEntries" | "status" | "emailVerified">[],
  requireEmailVerification: boolean
): DrawCandidate[] {
  return entries
    .filter((entry) => entry.status === "active")
    .filter((entry) => !requireEmailVerification || entry.emailVerified)
    .map((entry) => ({
      entryId: entry.id,
      tickets: Math.max(1, entry.totalEntries),
    }));
}

/** Weighted random draw without replacement. */
export function runWeightedDraw(
  candidates: DrawCandidate[],
  winnerCount: number
): string[] {
  const pool = candidates.map((c) => ({ ...c }));
  const winners: string[] = [];
  const count = Math.min(winnerCount, pool.length);

  for (let i = 0; i < count; i += 1) {
    const totalTickets = pool.reduce((sum, c) => sum + c.tickets, 0);
    if (totalTickets <= 0) break;

    let pick = randomInt(totalTickets);
    let chosenIndex = -1;
    for (let j = 0; j < pool.length; j += 1) {
      pick -= pool[j].tickets;
      if (pick < 0) {
        chosenIndex = j;
        break;
      }
    }
    if (chosenIndex < 0) chosenIndex = pool.length - 1;

    winners.push(pool[chosenIndex].entryId);
    pool.splice(chosenIndex, 1);
  }

  return winners;
}

export function getCountdownParts(targetIso: string, now = new Date()): {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
} {
  const totalMs = new Date(targetIso).getTime() - now.getTime();
  if (totalMs <= 0) {
    return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const seconds = Math.floor(totalMs / 1000);
  return {
    totalMs,
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    expired: false,
  };
}
