# Architecture decisions (pre-production pass)

Concise "why" notes for patterns enforced during the Phase 1 consistency pass.

## Client API calls

**Standard:** native `fetch` in `src/services/*.ts` with a local `parseJson<T>` helper that throws on `!response.ok` using `{ error?: string }` from the body.

- No axios — keeps bundle small and matches Next.js server/client boundaries.
- Mutations use `POST` + `Content-Type: application/json`; CSRF/origin checks run in middleware (`verifyMutationOrigin`).

## Admin CSV exports

**Standard:** `downloadFromApi(path)` from `src/lib/client/downloadFromApi.ts` — creates a temporary `<a>` with an absolute same-origin URL. Avoids `window.location.href` (eslint `@next/next/no-location-assign-relative-destination`).

## Server errors (production)

**Standard:** `publicApiError.ts` — never returns stack traces, Prisma errors, or file paths. Safe `Error.message` values only when they pass `isSafeClientMessage`. Everything else becomes a generic 500.

## Rate limiting

**Standard:** `withRateLimit` on auth, checkout, search, and payment routes. Upstash Redis when `UPSTASH_REDIS_REST_URL` + token are set; in-memory fallback in dev (warned at startup in `instrumentation.ts`).

Thresholds are per-route in route handlers — do not scatter ad-hoc counters.

## Caching

- **Static storefront pages:** Next.js ISR (`revalidate` in page metadata).
- **Cart/checkout/payment APIs:** `Cache-Control: no-store` — never cache mutable commerce state.
- **Immutable CDN assets:** long cache via nginx + `cdn.vibemusic.in`.

## Observability

OpenTelemetry (`src/lib/server/tracing.ts`) loads only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set — zero overhead otherwise. Wired from `src/instrumentation.ts` at Node startup.

## Images

`next/image` via `ProductImage` / `StorefrontThumbImage` for catalog surfaces. Raw `<img>` remains only where required: 360° viewer frames, admin upload previews, GP9 WebGL spinner, and liquid-glass effects.
