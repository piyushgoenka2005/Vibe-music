/**
 * Must be imported before any `server-only` modules in CLI ops scripts.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Module = require("module") as typeof import("module") & {
  _load: (request: string, parent: object, isMain: boolean) => unknown;
};
const originalLoad = Module._load.bind(Module);

Module._load = (request, parent, isMain) => {
  if (request === "server-only") {
    return {};
  }
  return originalLoad(request, parent, isMain);
};
