# Documentation

Canonical operational documentation for ViBE Music production.

| Folder | Purpose |
|--------|---------|
| [`ops/`](./ops/) | **Living** deploy, PostgreSQL, SMTP, CDN, backup, and VPS guides |
| [`release/`](./release/) | Historical RC / release-candidate reports (archive — some still mention retired Firestore) |
| [`reference/`](./reference/) | Specs, briefs, and sample exports |

**Current stack (authoritative):** PostgreSQL + Prisma · Auth.js · **Razorpay only** · DB search (not Elasticsearch) · VPS CDN. See root [`README.md`](../README.md) and [`ops/`](./ops/).

Start here for go-live: **[ops/DEPLOYMENT.md](./ops/DEPLOYMENT.md)**.
