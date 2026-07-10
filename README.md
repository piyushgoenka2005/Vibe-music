# ViBE Music

Enterprise ecommerce platform for musical instruments and pro audio.

**Stack:** Next.js 16 (App Router) · React 19 · Firebase/Firestore · Razorpay · TypeScript

---

## Project structure

```
src/            Application source (pages, components, API, server logic)
public/         Static assets (images, favicons)
deploy/         Production VPS scripts & nginx config
docs/release/   Release reports for stakeholders
e2e/            Playwright smoke tests
scripts/        Seed, migrate, and tooling scripts
.github/        CI validation workflow
```

**Root config files** (`.env.example`, `firebase.json`, `next.config.ts`, `package.json`, etc.) are standard for Next.js + Firebase projects — one file per concern, not bloat.

**Not part of the codebase** (generated locally, hidden in VS Code via `.vscode/settings.json`):

| Folder | Purpose |
|--------|---------|
| `node_modules/` | npm dependencies (~100k files) — recreated by `npm install` |
| `.next/` | Build cache — recreated by `npm run dev` / `npm run build` |
| `.data/` | Local Firestore fallback cache (dev only) |
| `test-results/` | Playwright output (dev only) |

---

## Quick start

```bash
npm install
cp .env.example .env.local   # configure Firebase, Razorpay, secrets
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Quality gates

```bash
npm run validate          # type-check + lint + unit tests + production build
npm run test:e2e          # Playwright smoke (11 tests; server must be running)
npm run validate:ci       # validate + E2E (matches GitHub Actions)
```

CI workflow: `.github/workflows/validate.yml`

---

## Production deployment

| Step | Command / doc |
|------|----------------|
| Release checklist | [`docs/release/FINAL_DEPLOYMENT_CHECKLIST.md`](docs/release/FINAL_DEPLOYMENT_CHECKLIST.md) |
| Executive sign-off | [`docs/release/FINAL_PRODUCTION_READINESS_REPORT.md`](docs/release/FINAL_PRODUCTION_READINESS_REPORT.md) |
| VPS deploy | [`deploy/VPS-SETUP.md`](deploy/VPS-SETUP.md) |
| Firestore rules + indexes | `npm run firebase:deploy-firestore` |
| Seed admin user | `npm run seed:admin` |

All release reports: [`docs/release/`](docs/release/)

---

## Key npm scripts

| Script | Purpose |
|--------|---------|
| `npm run build` | Production build (426 routes) |
| `npm run seed:admin` | Create first admin user |
| `npm run firebase:deploy-firestore` | Deploy Firestore rules + indexes |
| `npm run verify:integrations` | Validate external service configuration |

---

## Environment

Copy `.env.example` to `.env.local` and fill in:

- Firebase (client + admin SDK)
- Razorpay (keys + webhook secret)
- `GUEST_ORDER_ACCESS_SECRET` (min 32 chars)
- `RESEND_API_KEY` (transactional email)
- `UPSTASH_REDIS_*` (rate limiting)

See `.env.example` for the full list.
