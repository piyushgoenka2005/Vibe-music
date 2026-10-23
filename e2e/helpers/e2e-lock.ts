import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Cross-worker mutex for E2E fixtures that share global state.
 *
 * Playwright runs spec files in separate worker processes, so an in-process
 * mutex is not enough: the admin password-reset flow temporarily changes the
 * seeded E2E admin password while other workers may be logging in with it.
 * The lock is a file created with the exclusive `wx` flag in the OS temp dir.
 */
const LOCK_DIR = path.join(os.tmpdir(), "vibemusic-e2e-locks");
const LOCK_FILE = path.join(LOCK_DIR, "admin-credentials.lock");

let reentrantDepth = 0;

async function acquire(timeoutMs: number): Promise<void> {
  fs.mkdirSync(LOCK_DIR, { recursive: true });
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    try {
      const handle = fs.openSync(LOCK_FILE, "wx");
      fs.writeSync(handle, JSON.stringify({ pid: process.pid, at: Date.now() }));
      fs.closeSync(handle);
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }

    // Reclaim a lock left behind by a crashed worker.
    try {
      const raw = JSON.parse(fs.readFileSync(LOCK_FILE, "utf8")) as { at?: number };
      if (raw.at && Date.now() - raw.at > timeoutMs) fs.unlinkSync(LOCK_FILE);
    } catch {
      // Lock file disappeared or is mid-write — retry below.
    }

    if (Date.now() > deadline) {
      throw new Error(`Timed out after ${timeoutMs}ms waiting for the admin credential lock`);
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
}

function release(): void {
  try {
    fs.unlinkSync(LOCK_FILE);
  } catch {
    // Already gone.
  }
}

/** Serializes work that reads or mutates the shared seeded admin password. */
export async function withAdminCredentialLock<T>(
  work: () => Promise<T>,
  timeoutMs = 120_000,
): Promise<T> {
  if (reentrantDepth > 0) {
    reentrantDepth += 1;
    try {
      return await work();
    } finally {
      reentrantDepth -= 1;
    }
  }

  await acquire(timeoutMs);
  reentrantDepth += 1;
  try {
    return await work();
  } finally {
    reentrantDepth -= 1;
    release();
  }
}
