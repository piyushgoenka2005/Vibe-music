# Database Migration Strategy

## Overview

This document covers safe database migration procedures with rollback support for the Vibe Music production environment running Prisma ORM against PostgreSQL.

---

## Pre-Migration Checklist

```bash
# 1. Always start from a clean state
npm run validate           # type-check + lint + test + build

# 2. Back up the production database
pg_dump -U postgres vibemusic > backups/backup-$(date +%Y%m%d-%H%M%S).sql

# 3. Verify backup integrity
pg_restore -l backups/backup-*.sql > /dev/null && echo "Backup OK"

# 4. Review what will change
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma
```

---

## Migration Workflow

### Step 1: Generate Migration

```bash
# Create a new migration (never edit existing ones)
npx prisma migrate dev --name descriptive_name_here

# This will:
# - Generate SQL in prisma/migrations/<timestamp>_descriptive_name_here/
# - Apply it to your local dev database
# - Regenerate the Prisma Client
```

### Step 2: Review the Generated SQL

```bash
cat prisma/migrations/<timestamp>_descriptive_name_here/migration.sql
```

**Always review for:**
- `ALTER TABLE` on large tables (>100K rows) — use `CREATE INDEX CONCURRENTLY` instead
- Column additions with `NOT NULL` and no default — this will fail on existing rows
- Table renames — use `--create-only` and handle data migration manually
- `DROP COLUMN` — verify no code references it

### Step 3: Test Locally

```bash
# Reset your local database and re-apply all migrations
npx prisma migrate reset

# Run the full test suite
npx vitest run

# Verify the generated types are correct
npx tsc --noEmit
```

### Step 4: Deploy to Production

```bash
# On the production VPS:
git pull origin main
npm ci
npx prisma migrate deploy     # Applies pending migrations (no code generation)

# Verify
npx prisma db pull --force     # Confirm schema matches
```

---

## Rollback Procedures

### Option A: Prisma Migration Rollback (Preferred)

Prisma does not have built-in down-migrations. Instead:

1. **Create a reverse migration** that undoes the change:

```bash
# Example: rolling back an added column
npx prisma migrate dev --name rollback_add_feature_flag
```

In the generated `migration.sql`, write the reverse operation:

```sql
-- Undo: Remove the feature_flag column added in the previous migration
ALTER TABLE "products" DROP COLUMN IF EXISTS "feature_flag";
```

2. **Apply the rollback:**

```bash
npx prisma migrate deploy
```

3. **Verify rollback:**

```bash
npx prisma db pull --force     # Schema should match the rolled-back state
npx tsc --noEmit               # Types should still compile
npx vitest run                 # Tests should pass
```

### Option B: Point-in-Time Restore (Disaster Recovery)

If a migration corrupts data:

```bash
# 1. Stop the application
pm2 stop ecosystem.config.cjs

# 2. Restore from backup
psql -U postgres vibemusic < backups/backup-YYYYMMDD-HHMMSS.sql

# 3. (If using pg_dump with WAL archiving, restore to specific timestamp)
# pg_basebackup recovery target time

# 4. Restart
pm2 start ecosystem.config.cjs

# 5. Verify
curl -s https://vibemusic.in/api/health | jq .
```

### Option C: Manual SQL Rollback

For emergency rollbacks without touching Prisma:

```bash
# Connect to the database
psql -U postgres vibemusic

# Execute reverse operations
ALTER TABLE "products" DROP COLUMN IF EXISTS "new_column";
DROP INDEX IF EXISTS "products_new_idx";

# Then update the migration history table to mark it as applied
DELETE FROM "_prisma_migrations" WHERE id = '<migration_id>';
```

---

## Safe Migration Patterns

### Adding an Index (Non-Blocking)

```sql
-- NEVER do this on production (locks the table):
CREATE INDEX idx_products_status ON products(status);

-- ALWAYS do this instead (non-blocking):
CREATE INDEX CONCURRENTLY idx_products_status ON products(status);
```

For Prisma: Add the index in schema, then apply manually on production:

```bash
# Generate the SQL but don't apply automatically
npx prisma migrate dev --create-only --name add_index

# On production, edit the migration.sql to use CONCURRENTLY:
# CREATE INDEX CONCURRENTLY idx_products_status ON products(status);

# Then apply:
psql -U postgres vibemusic -f prisma/migrations/<migration>/migration.sql
npx prisma migrate deploy    # Marks migration as applied
```

### Adding a Column

```sql
-- SAFE: Add nullable column (no lock on existing rows)
ALTER TABLE "products" ADD COLUMN "new_feature" BOOLEAN;

-- SAFE: Add column with default (PostgreSQL 11+ is fast for most types)
ALTER TABLE "products" ADD COLUMN "new_feature" BOOLEAN DEFAULT false;

-- DANGEROUS: Adding NOT NULL without default fails on existing rows
ALTER TABLE "products" ADD COLUMN "new_feature" BOOLEAN NOT NULL;  -- FAILS
```

### Renaming a Column (Zero-Downtime)

```sql
-- Step 1: Add new column
ALTER TABLE "products" ADD COLUMN "display_name" TEXT;

-- Step 2: Copy data (batched for large tables)
UPDATE "products" SET "display_name" = "name" WHERE "display_name" IS NULL LIMIT 10000;

-- Step 3: Deploy code that reads from BOTH columns, writes to BOTH

-- Step 4: Once all writes go to new column, drop old
ALTER TABLE "products" DROP COLUMN "name";
ALTER TABLE "products" RENAME COLUMN "display_name" TO "name";
```

### Large Table Migrations (>100K rows)

```sql
-- For tables with >100K rows, batch the operation:

-- Add index in batches:
DO $$
DECLARE
    batch_size INT := 10000;
    total INT;
    processed INT := 0;
BEGIN
    SELECT COUNT(*) INTO total FROM "orders";
    WHILE processed < total LOOP
        -- Process batch (for data migrations, not index creation)
        UPDATE "orders" SET "status" = 'archived'
        WHERE "createdAt" < '2024-01-01'
        AND "id" IN (
            SELECT "id" FROM "orders"
            WHERE "createdAt" < '2024-01-01'
            LIMIT batch_size
        );
        processed := processed + batch_size;
        RAISE NOTICE 'Processed % / %', processed, total;
        COMMIT;
    END LOOP;
END $$;
```

---

## Schema Change Types & Risk Levels

| Change | Risk | Downtime | Rollback |
|--------|------|----------|----------|
| Add nullable column | 🟢 Low | None | Drop column |
| Add column with default | 🟡 Medium | None (PG 11+) | Drop column |
| Add index CONCURRENTLY | 🟢 Low | None | Drop index |
| Add index (standard) | 🔴 High | Table lock | Drop index |
| Rename column | 🟡 Medium | Code deploy needed | Rename back |
| Drop column | 🔴 High | Code deploy needed | Add column + restore data |
| Alter column type | 🔴 High | Table rewrite | Alter back |
| Add NOT NULL constraint | 🟡 Medium | Table scan | Drop constraint |
| Create table | 🟢 Low | None | Drop table |
| Drop table | 🔴 High | None | Restore from backup |

---

## Production Deployment Script

```bash
#!/bin/bash
set -euo pipefail

# Full migration + deploy script for production VPS
DEPLOY_DIR="/var/www/vibemusic"
BACKUP_DIR="$DEPLOY_DIR/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "=== Pre-migration backup ==="
mkdir -p "$BACKUP_DIR"
pg_dump -U postgres vibemusic | gzip > "$BACKUP_DIR/pre-migration-$TIMESTAMP.sql.gz"
echo "Backup saved: pre-migration-$TIMESTAMP.sql.gz"

echo "=== Validating code ==="
cd "$DEPLOY_DIR"
git pull origin main
npm ci --production
npm run validate

echo "=== Running migrations ==="
npx prisma migrate deploy

echo "=== Regenerating Prisma Client ==="
npx prisma generate

echo "=== Restarting application ==="
pm2 reload ecosystem.config.cjs

echo "=== Health check ==="
sleep 5
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://vibemusic.in/api/health)
if [ "$HEALTH" = "200" ]; then
    echo "✅ Deployment successful (HTTP $HEALTH)"
else
    echo "❌ Health check failed (HTTP $HEALTH)"
    echo "=== Rolling back ==="
    pm2 stop ecosystem.config.cjs
    gunzip -c "$BACKUP_DIR/pre-migration-$TIMESTAMP.sql.gz" | psql -U postgres vibemusic
    pm2 start ecosystem.config.cjs
    echo "⚠️ Rolled back to pre-migration state"
    exit 1
fi
```

---

## Environment-Specific Notes

| Environment | Migration Strategy |
|-------------|-------------------|
| **Local dev** | `npx prisma migrate dev` (resets + re-applies) |
| **CI/CD** | `npx prisma migrate deploy` (apply only, no codegen) |
| **Production** | `npx prisma migrate deploy` with backup + health check |
| **Staging** | Mirror production process, test first |

---

## Monitoring

After any migration:

```bash
# Watch for errors in the first 5 minutes
pm2 logs --lines 100 --nostream

# Check connection pool health
curl -s https://vibemusic.in/api/health | jq .database

# Monitor for slow queries (PostgreSQL)
psql -U postgres vibemusic -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle' AND now() - pg_stat_activity.query_start > interval '5 seconds';
"
```
