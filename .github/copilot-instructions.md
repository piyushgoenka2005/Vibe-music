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
