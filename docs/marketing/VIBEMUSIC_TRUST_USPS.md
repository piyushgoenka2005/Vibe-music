# Vibe Music — Trust USP playbook (audit → marketing)

Convert remediated loopholes (L-01–L-30) into customer-facing strengths. Use these in ads, PDP badges, checkout, email footers, and B2B decks.

## Top 10 headline USPs (use anywhere)

| #   | Headline                                                                          | Proof (audit)    |
| --- | --------------------------------------------------------------------------------- | ---------------- |
| 1   | **Server-verified checkout** — totals calculated on our systems, not your browser | L-15             |
| 2   | **Your account, your orders** — private order history and addresses               | L-19             |
| 3   | **Razorpay-secured payments** — UPI, cards, net banking with signed webhooks      | L-21             |
| 4   | **Real stock, real reservations** — inventory locked while you complete payment   | L-24             |
| 5   | **Registered Indian business** — legal entity, Kolkata address, GSTIN on invoice  | L-30             |
| 6   | **Built for speed** — fast homepage, optimized images, accessible on mobile       | L-11, L-12, L-14 |
| 7   | **Find gear faster** — instant search suggestions across the catalog              | L-07             |
| 8   | **Privacy-first analytics** — page views only with your consent                   | L-29             |
| 9   | **Enterprise-grade security** — rate limits, CSRF protection, security headers    | L-16, L-17       |
| 10  | **Tested before every release** — automated checkout & security tests in CI       | L-26             |

## Full mapping (L-01 – L-30)

| ID   | Former gap / drawback                | Customer USP                                                                | Suggested placement             |
| ---- | ------------------------------------ | --------------------------------------------------------------------------- | ------------------------------- |
| L-01 | Marquee confused screen readers      | **Inclusive storefront** — accessible carousels and navigation              | Accessibility page, B2G tenders |
| L-02 | Cart state unclear to assistive tech | **Clear cart feedback** — accessible cart labels on every device            | — (UX, no copy needed)          |
| L-03 | Redundant product titles             | **Clean product listings** — readable names without repetition              | PLP microcopy                   |
| L-04 | No live chat path                    | **Talk to a gear advisor** — optional live chat when enabled                | Header, contact                 |
| L-05 | Promo nav inconsistent               | **Featured collections highlighted** — easy discovery of flagship lines     | Nav promos                      |
| L-06 | Deal timers ambiguous                | **India-time deal countdowns** — transparent offer windows                  | Deals page                      |
| L-07 | Search felt broken                   | **Instant search suggestions** — find instruments in seconds                | Search hero, ads                |
| L-08 | Messy product URLs                   | **Clean, shareable product links** — SEO-friendly URLs                      | SEO deck                        |
| L-09 | Crawlability uncertain               | **Google-ready catalog** — sitemap and robots for discoverability           | SEO deck                        |
| L-10 | Rich results missing                 | **Rich product listings** — structured data on product pages                | SEO deck                        |
| L-11 | Heavy homepage                       | **Fast-first homepage** — lazy sections, bounded carousels                  | Performance page                |
| L-12 | Oversized deal images                | **Crisp deal imagery** — right-sized images on mobile                       | Deals marketing                 |
| L-13 | Slow third-party connects            | **Snappier page loads** — optimized CDN preconnects                         | — (technical)                   |
| L-14 | CWV not measured                     | **Performance monitored** — Lighthouse gates on key journeys                | B2B / tenders                   |
| L-15 | Price tampering risk                 | **Server-verified prices** — checkout totals from our servers               | Checkout, cart, ads             |
| L-16 | Missing security headers             | **Hardened web security** — modern browser protections                      | Security FAQ                    |
| L-17 | API abuse possible                   | **Protected checkout APIs** — rate limiting on sensitive actions            | — (technical)                   |
| L-18 | Auth oracle leaks                    | **Private account recovery** — no email existence hints                     | Privacy policy                  |
| L-19 | IDOR on orders                       | **Your orders stay yours** — account-scoped data access                     | Account, checkout               |
| L-20 | Vulnerable dependencies              | **Maintained platform** — dependency audit on every release                 | — (technical)                   |
| L-21 | Webhook forgery risk                 | **Payment integrity** — cryptographically verified Razorpay events          | Checkout trust strip            |
| L-22 | Origin exposed                       | **CDN-protected storefront** — global edge + hidden origin _(after deploy)_ | Infra deck                      |
| L-23 | Direct server access                 | **Firewall-hardened origin** — Cloudflare-only traffic _(after deploy)_     | Infra deck                      |
| L-24 | Oversell risk                        | **Accurate stock** — database locks prevent double-selling                  | PDP, checkout                   |
| L-25 | Load unknown                         | **Load-tested APIs** — smoke tests on critical paths                        | — (technical)                   |
| L-26 | Untested checkout                    | **Regression-tested checkout** — E2E tests on every merge                   | B2B deck                        |
| L-27 | Homepage crash risk                  | **Resilient homepage** — isolated section error boundaries                  | — (technical)                   |
| L-28 | No DR plan                           | **Business continuity** — documented recovery procedures                    | B2B / enterprise                |
| L-29 | Tracking without consent             | **Consent-based analytics** — respect for privacy choices                   | Privacy policy                  |
| L-30 | Legal footer incomplete              | **Transparent business identity** — registered entity + GSTIN               | Footer, invoices                |

## Copy blocks (ready to paste)

**Checkout hero**

> Secure checkout with server-verified totals. Pay via Razorpay — UPI, cards, or net banking.

**Cart abandonment email**

> Your cart is saved. Prices are confirmed on our servers at checkout — no surprises.

**Homepage “Why shop” payment card**

> Razorpay-encrypted checkout with server-verified totals.

**Account sign-in**

> Your orders are private to your account. Secure sign-in. Track purchases anytime.

**B2B / schools / churches**

> Vibe Music runs automated security and checkout tests on every release, with server-side price verification and inventory locking for high-traffic sales.

## Honest limits (do not overclaim)

- Say **“CDN-protected”** only after L-22/L-23 go-live (Cloudflare + UFW).
- Say **“GSTIN on site”** only when `NEXT_PUBLIC_GSTIN` is set in production (L-30).
- Say **“Lighthouse 90+”** only after `check:cwv:strict` passes on production URL (L-14).

## Storefront wiring

| Surface                     | File                                           |
| --------------------------- | ---------------------------------------------- |
| Checkout summary trust line | `src/data/trustSignals.ts` → `CheckoutSummary` |
| Payment methods badges      | `CheckoutPaymentMethods`                       |
| Auth sidebar bullets        | `AuthShell`                                    |
| Why Shop payments card      | `src/data/whyShop.ts`                          |
