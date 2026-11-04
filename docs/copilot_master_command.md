# Copilot master command for vibemusic.in

## Step 1 - save this as .github/copilot-instructions.md in the repo root

```markdown
# Copilot instructions - vibemusic.in (behaviour-preserving hardening)

Mission: strengthen and improve this e-commerce codebase WITHOUT changing features, flows, visible behaviour or business rules.

Hard rules

1. No new features. If a task needs one, write it to docs/FEATURE_BACKLOG.md and stop.
2. Never invent business facts (shipping threshold, phone numbers, GSTIN, legal entity, MRP, brand authorizations). Create docs/OWNER_DECISIONS.md entries and use clearly named config constants with TODO(owner) values.
3. Characterization tests first: before refactoring any module, add tests that pin its current behaviour. Refactors must keep them green.
4. Money is handled in integer paise. The server recomputes prices, discounts, shipping and tax; client-sent amounts are never trusted.
5. Every user-scoped read or write checks ownership on the server.
6. One finding per branch and pull request, named with its ID (for example VM-013). Small diffs, conventional commit messages, no unrelated edits.
7. Redirect, do not delete: every changed URL keeps its old URL alive with a single 301.
8. Add dependencies only with a written reason; prefer none. Run lint, type-check, unit, integration and E2E before declaring done.
9. Record before and after numbers in metrics/ledger.json for every performance, SEO or accessibility change.
10. If a command needs production access, secrets or infrastructure you cannot reach, stop and list exactly what the owner must do.

Definition of done: acceptance criterion in the audit met, tests added, ledger updated, behaviour unchanged, PR description lists risk and rollback.
```

## Step 2 - open Copilot Chat, switch to Agent mode, attach vibemusic_audit_dictionary.json, paste this prompt

```text
You are working in VS Code with GitHub Copilot in Agent mode (the same text works in Cursor). Read .github/copilot-instructions.md and the audit file vibemusic_audit_dictionary.json first. Your job: close the findings VM-001 to VM-046 whose editor_scope is "in_scope", without changing features or functionality. Items marked owner_decision need a value from the owner: do not guess, log them in docs/OWNER_DECISIONS.md and use a TODO(owner) constant. Items with change_class "Ops/infra (outside repo)" are hand-off notes only.

Work in this order and stop after each phase to report evidence (commands run, tests, before/after numbers):

PHASE 0 - Baseline and safety net
- Map each finding to the real code (file paths). Mark it confirmed, not applicable, or already fixed. Do not edit yet.
- Create metrics/ledger.json with baseline values for every KPI in the audit (Lighthouse mobile on home, category, product, cart, checkout; DOM nodes; HTML size; broken links; axe issues; npm audit; headers).
- Add characterization tests for checkout totals, cart, slug generation, shipping, coupons, metadata. Wire unit, integration and Playwright E2E into CI as a required check.

PHASE 1 - Trust boundaries (tests first, then minimal fixes)
- VM-029, VM-030, VM-033, VM-038: prove or fix server-side total recomputation, ownership checks, webhook signature and idempotency, atomic stock decrement. Every fix ships with a failing-then-passing test.

PHASE 2 - Content and config consolidation
- VM-001, 002, 003, 004, 005, 006, 007, 008, 009, 010, 011, 012, 042, 043, 045: introduce SHIPPING_POLICY and SITE_CONTACT constants, a single layout component, canonical slug and redirect map (301 only), catalogue audit script (read-only report), owner-decision log. No copy or number may be invented.

PHASE 3 - Markup, accessibility and SEO metadata
- VM-013 to VM-024: cart badge label, aria-hidden clones, separators, spec groups, reserved space, title and description limits, per-route metadata with canonicals, noindex on transactional routes, JSON-LD from existing data, facet canonicalisation.

PHASE 4 - Performance without behaviour change
- VM-025, 027, 028: lazy-render below-fold rails, remove duplicate DOM, sizes attributes, AVIF or WebP, priority hint for the LCP image, own all image hosts. Re-measure and record in the ledger.

PHASE 5 - Hardening that does not alter flows
- VM-031, 032, 034, 035, 037, 039: security headers (CSP in report-only mode first), rate limits with 429 and Retry-After, uniform auth errors, consent gating, error boundaries, timeouts, dependency and secret scan.

PHASE 6 - Observability and maintenance
- VM-040, 046: health endpoint with dependency checks, error tracking, a scheduled synthetic checkout, GA4 event tests, weekly Dependabot, monthly Lighthouse job writing to the ledger.

FINISH
- Produce docs/AUDIT_CLOSEOUT.md: findings closed with PR links, findings not applicable, owner decisions outstanding, final ledger table (before, after, target), and any hand-offs outside the repo. Never claim a finding is closed without its acceptance test or measurement.

Begin with PHASE 0 now and report before editing any source file.
```
