export const REQUEST_ID_HEADER = "x-request-id";

export function createRequestId(): string {
  return crypto.randomUUID();
}

export function getRequestId(request: Request): string {
  return request.headers.get(REQUEST_ID_HEADER) ?? createRequestId();
}

export interface RequestLogEntry {
  requestId: string;
  method: string;
  path: string;
  ip: string;
  userAgent?: string;
  status?: number;
  durationMs?: number;
  scope?: string;
}

export function logRequestStart(entry: RequestLogEntry): void {
  console.info(
    JSON.stringify({
      level: "info",
      type: "request.start",
      timestamp: new Date().toISOString(),
      ...entry,
    })
  );
}

export function logRequestEnd(entry: RequestLogEntry): void {
  console.info(
    JSON.stringify({
      level: "info",
      type: "request.end",
      timestamp: new Date().toISOString(),
      ...entry,
    })
  );
}

export function logSecurityEvent(
  event: string,
  meta: Record<string, unknown>
): void {
  console.warn(
    JSON.stringify({
      level: "warn",
      type: "security",
      event,
      timestamp: new Date().toISOString(),
      ...meta,
    })
  );
}
