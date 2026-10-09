/** Patterns from browser extensions — not Vibe Music application errors. */
export const EXTENSION_CONSOLE_NOISE_PATTERN =
  /save-page|Extension context invalidated|chrome-extension:|contentscript\.js|inpage\.js|ObjectMultiplex|app-init-liveness|background-liveness|orphaned data for stream|MaxListenersExceededWarning|setMaxListeners\(\)|MetaMask no longer injects web3/i;

function collectMessages(value: unknown, depth = 0, out: string[] = []): string[] {
  if (depth > 4) return out;

  if (value instanceof Error) {
    out.push(value.message, value.stack ?? "");
    if (value.cause) collectMessages(value.cause, depth + 1, out);
    return out;
  }

  if (typeof value === "string") {
    out.push(value);
    return out;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("message" in record) collectMessages(record.message, depth + 1, out);
    if ("reason" in record) collectMessages(record.reason, depth + 1, out);
  }

  return out;
}

export function isBrowserExtensionConsoleNoise(value: unknown): boolean {
  const blob = collectMessages(value).join(" ");
  return EXTENSION_CONSOLE_NOISE_PATTERN.test(blob);
}

export function isExtensionScriptFilename(filename?: string | null): boolean {
  if (!filename) return false;
  return /contentscript\.js|chrome-extension:/i.test(filename);
}
