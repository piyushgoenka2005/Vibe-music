# Disaster recovery (L-28)

Documented targets for Vibe Music production. Adjust with your hosting provider’s actual SLAs.

| Metric                    | Target | Current practice                                             |
| ------------------------- | ------ | ------------------------------------------------------------ |
| **RPO** (max data loss)   | ≤ 24 h | Daily Postgres backups via `deploy/verify-backups.sh` on VPS |
| **RTO** (time to restore) | ≤ 4 h  | Manual restore from `/var/backups/vibe` + `deploy/update.sh` |

## Backup locations

- On-VPS: `/var/backups/vibe` (see `deploy/verify-backups.sh`)
- Recommended: second copy off-server (S3, another region, or encrypted object storage)

## Restore drill (quarterly)

1. Provision a staging VPS or local Docker Postgres.
2. Restore the latest backup dump into a fresh database.
3. Point `DATABASE_URL` at the restored DB and run `npm run db:migrate`.
4. Run `npm run verify:prod-signoff` against staging.
5. Record actual RTO and any gaps.

## Contacts

- Hosting / VPS provider support
- Razorpay dashboard for payment reconciliation after outage
- Domain/DNS (Cloudflare) for failover or maintenance page
