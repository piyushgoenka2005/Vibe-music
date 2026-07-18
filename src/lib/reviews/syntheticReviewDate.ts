/** ~3 calendar years in ms (includes leap-day average). */
const THREE_YEARS_MS = Math.round(3 * 365.25 * 24 * 60 * 60 * 1000);

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function isSyntheticReviewUserId(userId: string): boolean {
  return userId.startsWith("synthetic:");
}

/**
 * Stable pseudo-random ISO timestamp within the last 3 years from `now`.
 * Same seed → same relative offset (dates stay in-window as time advances).
 */
export function syntheticReviewCreatedAt(
  seed: string,
  now: Date = new Date()
): string {
  const end = now.getTime();
  const start = end - THREE_YEARS_MS;
  const span = Math.max(1, end - start);
  const dayOffset = hashString(seed) % span;
  const hour = 8 + (hashString(`${seed}:h`) % 14);
  const minute = hashString(`${seed}:m`) % 60;
  const second = hashString(`${seed}:s`) % 60;

  const instant = new Date(start + dayOffset);
  instant.setUTCHours(hour, minute, second, 0);

  if (instant.getTime() > end) {
    instant.setTime(end - (dayOffset % 86_400_000));
  }
  if (instant.getTime() < start) {
    instant.setTime(start + (dayOffset % 86_400_000));
  }

  return instant.toISOString();
}

export function withSyntheticReviewDates<
  T extends { id: string; userId: string; createdAt: string },
>(reviews: T[], now: Date = new Date()): T[] {
  return reviews.map((review) =>
    isSyntheticReviewUserId(review.userId)
      ? { ...review, createdAt: syntheticReviewCreatedAt(review.id, now) }
      : review
  );
}
