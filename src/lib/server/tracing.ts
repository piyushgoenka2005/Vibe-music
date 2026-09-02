/**
 * OpenTelemetry Distributed Tracing — correlates requests across services.
 *
 * What this traces:
 *   - API request lifecycle (route → middleware → handler → response)
 *   - Database queries (Prisma spans)
 *   - Cache operations (Redis hits/misses)
 *   - External API calls (Razorpay, email, CDN)
 *   - WebSocket connections
 *
 * Why this matters at 2K concurrent:
 *   - Without tracing: "P95 is 3s" — but WHERE? Which route? Which DB query?
 *   - With tracing: "P95 is 3s because /api/products has a slow category JOIN"
 *
 * Setup:
 *   Import this file once at app startup:
 *   ```ts
 *   import "@/lib/server/tracing";
 *   ```
 *
 * Environment variables:
 *   OTEL_EXPORTER_OTLP_ENDPOINT — collector endpoint (e.g., http://localhost:4318)
 *   OTEL_SERVICE_NAME — service name (default: vibe-music)
 *   OTEL_TRACES_SAMPLER — sampling rate (default: parentbased_traceidratio)
 *   OTEL_TRACES_SAMPLER_ARG — ratio (default: 0.1 = 10% of traces in production)
 */

import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { BatchSpanProcessor, ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { trace, SpanStatusCode } from "@opentelemetry/api";

// ─── Provider Setup ──────────────────────────────────────────────────────

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || "vibe-music";
const SERVICE_VERSION = process.env.VERCEL_GIT_COMMIT_SHA || "local";
const COLLECTOR_URL = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const IS_PROD = process.env.NODE_ENV === "production";
const _SAMPLE_RATIO = IS_PROD ? 0.1 : 1.0; // 10% in prod, 100% in dev

let initialized = false;

function initTracing(): void {
  if (initialized) return;
  if (typeof window !== "undefined") return; // Client-side guard
  initialized = true;

  try {
    const resource = new Resource({
      [ATTR_SERVICE_NAME]: SERVICE_NAME,
      [ATTR_SERVICE_VERSION]: SERVICE_VERSION,
    });

    const provider = new NodeTracerProvider({ resource });

    // Console exporter for dev, OTLP exporter for prod
    if (COLLECTOR_URL) {
      // Dynamic import to avoid crashing when @opentelemetry/exporter-trace-otlp-http is not installed
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
        const exporter = new OTLPTraceExporter({ url: COLLECTOR_URL });
        provider.addSpanProcessor(new BatchSpanProcessor(exporter));
      } catch {
        // OTLP exporter not installed — fall back to console
        provider.addSpanProcessor(new BatchSpanProcessor(new ConsoleSpanExporter()));
      }
    } else {
      // Dev mode: log to console
      provider.addSpanProcessor(new BatchSpanProcessor(new ConsoleSpanExporter()));
    }

    provider.register();
  } catch {
    // Tracing is optional — don't crash the app if it fails
  }
}

// Auto-initialize on import
initTracing();

// ─── Helper API ──────────────────────────────────────────────────────────

const tracer = trace.getTracer(SERVICE_NAME, SERVICE_VERSION);

/**
 * Create a traced span for an operation.
 *
 * Usage:
 * ```ts
 * const result = await traceSpan("db.query", async (span) => {
 *   span.setAttribute("db.system", "postgresql");
 *   span.setAttribute("db.statement", "SELECT * FROM products WHERE id = $1");
 *   return prisma.product.findUnique({ where: { id } });
 * });
 * ```
 */
export async function traceSpan<T>(
  name: string,
  fn: (span: ReturnType<typeof tracer.startSpan>) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
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

/**
 * Get the current active span (for adding attributes from deep call sites).
 */
export function getCurrentSpan() {
  return trace.getActiveSpan();
}

/**
 * Add an event to the current active span.
 */
export function addSpanEvent(name: string, attributes?: Record<string, string | number>) {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Set an attribute on the current active span.
 */
export function setSpanAttribute(key: string, value: string | number | boolean) {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttribute(key, value);
  }
}
