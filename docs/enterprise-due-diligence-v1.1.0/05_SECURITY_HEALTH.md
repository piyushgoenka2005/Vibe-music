# 05 — Security Health

**HEAD:** `2f3d552` · **Mode:** read-only

## Score: **84 / 100**

---

## Critical

**None verified** against current HEAD for core payment, invoice token, CSRF, or media SSRF controls.

---

## Findings register

| ID | Sev | Finding | Evidence |
|----|-----|---------|----------|
| SEC-01 | **High** | Google OAuth `allowDangerousEmailAccountLinking: true` | `src/auth.ts:98–101` |
| SEC-02 | Medium | Regex HTML sanitizer (bypassable vs DOMPurify) | `src/lib/security/sanitize.ts:1–11` |
| SEC-03 | Medium | ~28 API routes leak `error.message` to clients | e.g. addresses, rentals bookings, giveaway entries, some admin refunds |
| SEC-04 | Medium | JWT admin claims refresh on sign-in/`update` — possible staleness | `src/auth.ts` JWT callbacks |
| SEC-05 | Low | Dev-only auth secret fallback when `AUTH_SECRET` missing | `src/auth.ts:109–117` (production returns `undefined`) |
| SEC-06 | Low | Media thumb 302 fallback to allowlisted CDN URL under miss/rate-limit | `src/app/api/media/thumb/route.ts` |
| SEC-07 | Low | `AdminGuard` is client UI gate; APIs enforce separately (OK if understood) | `src/components/admin/AdminGuard.tsx` |

---

## Controls verified OK

| Control | Evidence |
|---------|----------|
| Password hashing bcrypt 12 rounds | `src/lib/auth/password.ts` |
| Credentials Zod + inactive rejection | `src/auth.ts` authorize |
| Admin `requireAdmin` + permission matrix | `src/lib/auth/require-admin.ts`, `permissions.ts` |
| Proxy CSRF (Origin/Referer; fail-closed in prod) | `src/proxy.ts`, `mutation-origin.ts` |
| Edge + route rate limits | `src/proxy.ts`, `enforceRateLimit` |
| Invoice: email alone rejected; HMAC token | `resolveInvoiceOrder.ts`, `invoiceAccessToken.ts` |
| Rental invoice: owner / tracking token / admin | `api/rentals/invoices/[id]/html/route.ts` |
| `resolveLinkHref` blocks `javascript:` / `//` | `src/lib/routes.ts:337–341` |
| Admin CTA href Zod refine | `src/lib/validations/admin.ts` `safeStorefrontHref` |
| Media thumb HTTPS allowlist + `redirect: "manual"` | `api/media/thumb/route.ts` |
| Razorpay payment + webhook HMAC timing-safe | `lib/razorpay/signature.ts`, webhook route |
| Webhook client errors generic | webhook catch returns fixed message |
| Secrets not committed; `.env*` gitignored | `.gitignore`, `.env.example` names only |
| Blog/giveaway HTML passes `sanitizeHtml` before sink | blog render + GiveawayCampaignPage |

---

## Dependency / supply-chain

- `npm audit` / SCA report was **not executed** in this read-only session — dependency CVE posture **not verified**.
- Lockfile present (`package-lock.json` expected with `npm ci` in CI).

---

## Security score rationale

+ Strong commerce/auth/edge controls at HEAD  
− Dangerous OAuth linking flag  
− Regex sanitizer + residual error leaks  
− No SCA run in this audit  

**84/100**
