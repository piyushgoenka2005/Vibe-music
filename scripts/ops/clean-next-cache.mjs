import { rmSync } from "node:fs";
import { join } from "node:path";

const nextDir = join(process.cwd(), ".next");

try {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("Removed .next cache");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to remove .next: ${message}`);
  console.error("Stop the dev server (Ctrl+C), then run: npm run clean");
  process.exit(1);
}
