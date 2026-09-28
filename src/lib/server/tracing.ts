/**
 * OpenTelemetry Distributed Tracing — correlates requests across services.
 *
 * Disabled by default in local dev to keep `npm run dev` output readable.
 * Enable explicitly when you have a collector or want console spans:
 *
 *   OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
 *   OTEL_TRACES_CONSOLE=1   # optional: log spans to the terminal (dev only)
 */

import type { Span } from "@opentelemetry/api";
import { trace, SpanStatusCode } from "@opentelemetry/api";

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || "vibe-music";
const SERVICE_VERSION = process.env.VERCEL_GIT_COMMIT_SHA || "local";
const COLLECTOR_URL = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim() ?? "";
const CONSOLE_TRACES =
  process.env.OTEL_TRACES_CONSOLE === "1" || process.env.OTEL_TRACES_CONSOLE === "true";

let initialized = false;

export function isTracingEnabled(): boolean {
  return Boolean(COLLECTOR_URL) || CONSOLE_TRACES;
}

export function ensureTracingInitialized(): void {
  if (!isTracingEnabled() || initialized || typeof window !== "undefined") return;
  initialized = true;

  try {
    // Lazy require so dev servers without tracing never load OTEL SDK modules.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BatchSpanProcessor, ConsoleSpanExporter } = require("@opentelemetry/sdk-trace-base");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Resource } = require("@opentelemetry/resources");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const {
      ATTR_SERVICE_NAME,
      ATTR_SERVICE_VERSION,
    } = require("@opentelemetry/semantic-conventions");

    const resource = new Resource({
      [ATTR_SERVICE_NAME]: SERVICE_NAME,
      [ATTR_SERVICE_VERSION]: SERVICE_VERSION,
    });

    const provider = new NodeTracerProvider({ resource });

    if (COLLECTOR_URL) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
        const exporter = new OTLPTraceExporter({ url: COLLECTOR_URL });
        provider.addSpanProcessor(new BatchSpanProcessor(exporter));
      } catch (error) {
        if (!CONSOLE_TRACES) {
          console.warn(
            "[tracing] OTLP exporter unavailable; set OTEL_TRACES_CONSOLE=1 to log spans locally.",
            error,
          );
          initialized = false;
          return;
        }
        provider.addSpanProcessor(new BatchSpanProcessor(new ConsoleSpanExporter()));
      }
    } else if (CONSOLE_TRACES) {
      provider.addSpanProcessor(new BatchSpanProcessor(new ConsoleSpanExporter()));
    }

    provider.register();
  } catch {
    initialized = false;
  }
}

const tracer = trace.getTracer(SERVICE_NAME, SERVICE_VERSION);

const noopSpan = {
  spanContext: () => ({ traceId: "", spanId: "", traceFlags: 0 }),
  setAttribute: () => noopSpan,
  setAttributes: () => noopSpan,
  addEvent: () => noopSpan,
  addLink: () => noopSpan,
  addLinks: () => noopSpan,
  setStatus: () => noopSpan,
  updateName: () => noopSpan,
  end: () => {},
  isRecording: () => false,
  recordException: () => {},
} as unknown as Span;

export async function traceSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  if (!isTracingEnabled()) {
    return fn(noopSpan);
  }

  ensureTracingInitialized();
  if (!initialized) {
    return fn(noopSpan);
  }

  return tracer.startActiveSpan(name, async (span) => {
    try {
      if (attributes) {
        for (const [key, value] of Object.entries(attributes)) {
          span.setAttribute(key, value);
        }
      }
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

export function getCurrentSpan() {
  if (!isTracingEnabled()) return undefined;
  return trace.getActiveSpan();
}

export function addSpanEvent(name: string, attributes?: Record<string, string | number>) {
  const span = getCurrentSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

export function setSpanAttribute(key: string, value: string | number | boolean) {
  const span = getCurrentSpan();
  if (span) {
    span.setAttribute(key, value);
  }
}
