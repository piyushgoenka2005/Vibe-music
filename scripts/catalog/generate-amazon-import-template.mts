/** @deprecated Use `npm run generate:vibemusic-bulk-template` */
import { spawnSync } from "node:child_process";
import path from "node:path";

const script = path.join(process.cwd(), "scripts", "catalog", "generate-vibemusic-bulk-template.mts");
const result = spawnSync(process.execPath, ["--import", "tsx", script], {
  stdio: "inherit",
  cwd: process.cwd(),
});

process.exit(result.status ?? 1);
