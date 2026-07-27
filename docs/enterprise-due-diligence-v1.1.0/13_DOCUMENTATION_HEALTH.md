# 13 — Documentation Health

**HEAD:** `2f3d552` · **Mode:** read-only

## Score: **75 / 100**

---

## Inventory

- ~47 markdown files outside `node_modules`/`.next` (root + `docs/` + deploy).
- Major trees: `docs/ops/`, `docs/release/`, `docs/reference/`, plus prior audit cards (`MASTER_E2E_AUDIT_JUL25.md`, `PLATFORM_REPORT_CARD.md`, etc.).
- Agent guidance: `AGENTS.md`, `CLAUDE.md` (Next.js docs caveat).

---

## Strengths

- Ops runbooks: DEPLOYMENT, GO_LIVE, POSTGRESQL, VPS-SETUP, SMTP.
- Release matrix / handover / security / a11y / performance historical reports.
- `.env.example` documents variable names for onboarding.

---

## Risks

| ID | Sev | Finding | Evidence |
|----|-----|---------|----------|
| DOC-01 | Medium | Multiple historical audit scores may **conflict** with current HEAD — must not be trusted without re-verify | `docs/*AUDIT*`, `FINAL_*` |
| DOC-02 | Medium | Some reports predate Next 16 `proxy.ts` / recent cart/trust fixes | compare dates vs HEAD `2f3d552` |
| DOC-03 | Low | Finance/EMI docs may linger after schema drop migration | EMI drop migration vs old feature docs |
| DOC-04 | Info | This due-diligence pack is the authoritative snapshot for 27 Jul 2026 | `docs/enterprise-due-diligence-v1.1.0/` |

---

## Documentation score rationale

+ Rich ops/release documentation  
− Stale/overlapping audit artifacts without supersession policy  

**75/100**
