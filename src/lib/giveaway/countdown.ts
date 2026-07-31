/** Client-safe countdown helpers (no Node.js builtins). */

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
