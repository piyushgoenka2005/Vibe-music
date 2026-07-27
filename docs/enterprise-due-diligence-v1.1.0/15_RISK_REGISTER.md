# 15 — Risk Register

**HEAD:** `2f3d552` · **Mode:** read-only  
**Classification:** Critical / High / Medium / Low

---

## Critical

_None verified at HEAD for payment HMAC, invoice token auth, CSRF fail-closed, or media SSRF allowlist+manual redirect._

---

## High

| ID | Area | Risk | Evidence | Blocker type |
|----|------|------|----------|--------------|
| R-H1 | Security | Google `allowDangerousEmailAccountLinking: true` enables email-based account linking without explicit linking UX | `src/auth.ts:98–101` | Security / compliance |

---

## Medium

| ID | Area | Risk | Evidence | Blocker type |
|----|------|------|----------|--------------|
| R-M1 | Security | Regex HTML sanitizer bypass risk for admin HTML | `src/lib/security/sanitize.ts` | Security |
| R-M2 | API | ~28 routes leak `error.message` | API catch blocks | Security / ops |
| R-M3 | Data | Dual products.json drift (225B / hash mismatch) | root vs `src/data/catalog/products.json` | Reliability |
| R-M4 | Database | Unbounded paid-order fetch | `orderRepository.findPaidOrders` | Performance / reliability |
| R-M5 | Database | Order.userId without Prisma User FK | schema | Integrity |
| R-M6 | Auth | Admin JWT claim staleness until update | `src/auth.ts` callbacks | Security |
| R-M7 | Testing | No coverage gates; thin deep e2e | vitest/e2e inventory | Quality |
| R-M8 | Ops | Live backup + Razorpay smoke not proven by CI alone | deploy scripts exist; host proof external | Operational |
| R-M9 | Product | Big Names fallback assets still third-party filenames | `bigNamesDeals.ts` | Business / trust |
| R-M10 | Architecture | Oversized hubs (catalogService, GP9, checkout) | line counts | Scalability / maintainability |

---

## Low

| ID | Area | Risk | Evidence |
|----|------|------|----------|
| R-L1 | Auth | Dev auth secret fallback (non-prod only) | `src/auth.ts:109–117` |
| R-L2 | Media | Thumb 302 to allowlisted CDN on miss | thumb route |
| R-L3 | Perf | Lighthouse perf gate ≥45 permissive | lighthouse.yml |
| R-L4 | A11y | No formal WCAG certificate | docs + absence |
| R-L5 | API | No API versioning | route structure |
| R-L6 | Docs | Stale overlapping audit reports | `docs/*` |

---

## Already mitigated (verified at HEAD — do not re-open without re-check)

| Topic | Evidence |
|-------|----------|
| Guest invoice email-only access | `resolveInvoiceOrder` rejects email without token |
| Razorpay webhook unsigned processing | signature required + HMAC |
| Media redirect-follow SSRF | `redirect: "manual"` |
| Fake seeded discounts on homepage cards | no `seededDiscount`/`fakeMrp` in src |
| Catalog fake review floor 300 | cleared in products.json at recent commits |
| Proxy CSRF | mutation-origin + proxy |

---

## False positives / out of scope

| Claim | Disposition |
|-------|-------------|
| “No middleware.ts means no edge security” | **False** — `src/proxy.ts` is the Next 16 edge entry |
| “COD/EMI incomplete” | **By design** — EMI migration dropped; COD/EMI removed from product set |
| Prior “98% complete” report cards | **Not authoritative** unless re-verified against HEAD |

---

## Residual enterprise blockers summary

1. Resolve OAuth linking policy (High).  
2. Harden HTML sanitization + API error envelopes (Medium).  
3. Single-source catalog JSON (Medium).  
4. Host-side backup + live payment proof (Operational Medium).
