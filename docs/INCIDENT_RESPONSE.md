# Incident Response Runbook — Vibe Music

## Overview

This runbook covers procedures for handling production incidents, scaling events, and rollback scenarios for the Vibe Music storefront running on a 4-core VPS with PM2 cluster mode.

**Architecture**:
```
Cloudflare CDN → Nginx (SSL + cache + rate limit) → PM2 (4 workers) → PostgreSQL + Redis
```

**Monitoring**:
- Grafana: `https://vibemusic.in/grafana` (admin/vibe-admin-2024)
- Uptime Kuma: `https://vibemusic.in/uptime`
- Prometheus: `http://localhost:9090`
- Health endpoint: `https://vibemusic.in/api/health`
- Metrics endpoint: `https://vibemusic.in/api/metrics`

---

## 1. Incident Severity Levels

| Level | Description | Response Time | Example |
|---|---|---|---|
| **P0 — Critical** | Site completely down, payments failing | 5 minutes | PostgreSQL unreachable, all workers crashed |
| **P1 — Major** | Major feature broken, >50% users affected | 15 minutes | Checkout failing, search broken |
| **P2 — Minor** | Feature degraded, <50% users affected | 1 hour | Slow product pages, admin UI issues |
| **P3 — Low** | Cosmetic or non-critical | Next business day | Typo, minor UI glitch |

---

## 2. Common Incidents & Resolution

### 2.1 Site Completely Down (P0)

**Symptoms**: All requests return 502/503, Uptime Kuma alerts

**Diagnosis**:
```bash
# Check PM2 status
pm2 status

# Check if Node.js processes are running
ps aux | grep "next start"

# Check Nginx status
sudo systemctl status nginx

# Check logs
pm2 logs --lines 50
tail -50 /var/log/nginx/error.log
```

**Resolution**:
```bash
# Restart PM2 cluster
pm2 restart ecosystem.config.cjs

# If PM2 is down entirely
pm2 start ecosystem.config.cjs

# If Nginx is down
sudo systemctl restart nginx

# If PostgreSQL is down
sudo systemctl restart postgresql
```

**Escalation**: If restart doesn't fix within 5 minutes, check database connectivity (Section 2.3).

### 2.2 High Error Rate (>5% 5xx errors) (P1)

**Symptoms**: Grafana "Error Rate" panel spikes, Uptime Kuma partial outage

**Diagnosis**:
```bash
# Check recent errors
pm2 logs --err --lines 100

# Check circuit breaker status
curl -s http://localhost:3000/api/health | jq '.circuitBreaker'

# Check backpressure
curl -s http://localhost:3000/api/health | jq '.backpressure'

# Check memory usage
pm2 monit
```

**Resolution**:
```bash
# If memory is high (>700MB per worker)
pm2 restart ecosystem.config.cjs

# If specific worker is unhealthy
pm2 restart <worker_id>

# If circuit breaker is open (DB issue)
# Wait 30s for cooldown, or restart to reset
pm2 restart ecosystem.config.cjs
```

### 2.3 Database Unreachable (P0)

**Symptoms**: Circuit breaker OPEN, "Database connection failed" in logs

**Diagnosis**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U vibe -d vibe_music -c "SELECT 1"

# Check connection count
psql -U vibe -d vibe_music -c "SELECT count(*) FROM pg_stat_activity"

# Check disk space
df -h /var/lib/postgresql
```

**Resolution**:
```bash
# Restart PostgreSQL
sudo systemctl restart postgresql

# If disk is full
sudo du -sh /var/lib/postgresql/*
# Clean old WAL logs if needed
sudo -u postgres pg_archivecleanup /var/lib/postgresql/*/main/pg_wal <oldest_wal>

# If too many connections
psql -U vibe -d vibe_music -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '10 minutes'"
```

### 2.4 Redis Unreachable (P1)

**Symptoms**: Redis circuit breaker OPEN, cache misses, slightly slower responses

**Diagnosis**:
```bash
# Check Redis status
redis-cli ping

# Check Redis memory
redis-cli info memory

# Check connection count
redis-cli info clients
```

**Resolution**:
```bash
# Redis outage is DEGRADED, not DOWN
# The app falls back to in-memory LRU cache automatically
# Users see slightly older data but site continues to work

# Restart Redis if needed
sudo systemctl restart redis-server

# Clear Redis if corrupted
redis-cli FLUSHALL
```

### 2.5 Response Times Spike (>2s P95) (P1)

**Symptoms**: Grafana latency panels spike, users complain about slow pages

**Diagnosis**:
```bash
# Check which scope is under pressure
curl -s http://localhost:3000/api/health | jq '.backpressure'

# Check DB query times
curl -s http://localhost:3000/api/metrics | grep request_duration

# Check if Nginx cache is working
curl -sI https://vibemusic.in/ | grep X-Cache-Status
# HIT = good, MISS = Nginx cache not configured or expired, BYPASS = logged-in user

# Check PM2 memory
pm2 monit
```

**Resolution**:
```bash
# If Nginx cache is MISS for homepage
sudo rm -rf /var/cache/nginx/vibe-pages/*
sudo systemctl reload nginx

# If memory is high
pm2 restart ecosystem.config.cjs

# If DB is slow
# Check slow queries
psql -U vibe -d vibe_music -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds'"
```

### 2.6 Rate Limiting Too Aggressive (P2)

**Symptoms**: Legitimate users getting 429 errors

**Diagnosis**:
```bash
# Check rate limit hits
curl -s http://localhost:3000/api/metrics | grep rate_limit

# Check which scope is hitting limits
curl -s http://localhost:3000/api/health | jq '.backpressure.scopes'
```

**Resolution**:
```bash
# Adjust Nginx rate limits (edit deploy/nginx/vibemusic.in.conf)
# auth_limit: 10r/s → 20r/s (if login is too strict)
# api_limit: 60r/s → 120r/s (if API is too strict)

sudo cp deploy/nginx/vibemusic.in.conf /etc/nginx/sites-available/vibemusic.in.conf
sudo nginx -t && sudo systemctl reload nginx
```

### 2.7 Out of Memory (P0)

**Symptoms**: PM2 keeps restarting workers, "JavaScript heap out of memory" in logs

**Diagnosis**:
```bash
# Check PM2 status
pm2 status

# Check memory per worker
pm2 monit

# Check system memory
free -h
```

**Resolution**:
```bash
# Immediate: restart with memory cap
pm2 restart ecosystem.config.cjs

# If persistent: increase max_memory_restart in ecosystem.config.cjs
# Default: 800M per worker

# If system is out of memory
# Kill non-essential processes
sudo systemctl stop docker  # if not needed
sudo systemctl stop redis-server  # if not needed temporarily

# Long-term: upgrade VPS RAM
```

---

## 3. Scaling Procedures

### 3.1 Vertical Scaling (Upgrade VPS)

```bash
# 1. Take snapshot/backup
sudo -u postgres pg_dump vibe_music > /tmp/backup_$(date +%Y%m%d).sql

# 2. Stop services
pm2 stop ecosystem.config.cjs

# 3. Upgrade VPS (via hosting provider)

# 4. After upgrade, update connection limit
# In src/lib/db/prisma.ts:
# const CONNECTION_LIMIT = isProd ? 30 : 10;  # Increased for more RAM

# 5. Update PM2 config if more cores
# In ecosystem.config.cjs:
# instances: "max"  # Automatically uses all cores

# 6. Restart
pm2 start ecosystem.config.cjs
sudo systemctl reload nginx
```

### 3.2 Horizontal Scaling (Add VPS)

For >4K concurrent, add a second VPS:

```bash
# 1. Set up second VPS with same config
# 2. Update Nginx upstream to include both:
# upstream vibe_nextjs {
#     server 127.0.0.1:3000;
#     server 10.0.0.2:3000;
#     keepalive 256;
# }
# 3. Use shared PostgreSQL (or read replica)
# 4. Use Redis for shared session/cache
```

---

## 4. Rollback Procedures

### 4.1 Code Rollback (Git)

```bash
# View recent commits
git log --oneline -10

# Rollback to specific commit
git checkout <commit_hash>

# Rebuild
npm ci
npm run build

# Restart
pm2 restart ecosystem.config.cjs
```

### 4.2 Database Rollback

```bash
# Restore from backup
psql -U vibe -d vibe_music < /tmp/backup_YYYYMMDD.sql

# Or rollback specific migration
npx prisma migrate resolve --rolled-back <migration_name>
```

### 4.3 Nginx Rollback

```bash
# Restore previous config
cp /etc/nginx/sites-available/vibemusic.in.conf.bak \
   /etc/nginx/sites-available/vibemusic.in.conf

sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. Monitoring Thresholds & Alerts

### Grafana Alert Rules (deploy/monitoring/alert-rules.yml)

| Alert | Condition | Severity | Action |
|---|---|---|---|
| App Down | Health check fails 3x | Critical | Restart PM2 |
| Database Unreachable | Circuit breaker OPEN | Critical | Check PostgreSQL |
| High Error Rate | >5% 5xx for 5min | Warning | Check logs |
| High Memory | >700MB per worker | Warning | Restart PM2 |
| Slow Responses | P95 >3s for 5min | Warning | Check cache/DB |
| Frequent Restarts | >3 restarts in 10min | Warning | Check OOM |
| Rate Limit Spike | >100 429s/min | Info | Check for abuse |
| Disk Space | >85% usage | Warning | Clean logs/cache |

### Health Check Response

```json
{
  "status": "healthy|degraded|unhealthy",
  "circuitBreaker": {
    "database": { "state": "closed|open|half_open" },
    "redis": { "state": "closed|open|half_open" }
  },
  "backpressure": {
    "underPressure": false,
    "scopes": [{ "scope": "api", "inFlight": 45, "maxConcurrent": 300 }]
  },
  "cache": { "memoryEntries": 120, "staleEntries": 5 },
  "uptime": 86400,
  "memoryMB": 256
}
```

---

## 6. Post-Incident Checklist

After every P0/P1 incident:

- [ ] Root cause identified and documented
- [ ] Fix deployed and verified
- [ ] Monitoring thresholds adjusted if needed
- [ ] Runbook updated with new scenario
- [ ] Database backup verified
- [ ] Load test run to confirm capacity
- [ ] Team notified of resolution
- [ ] Post-mortem scheduled (for P0)

---

## 7. Emergency Contacts

| Role | Contact | When |
|---|---|---|
| VPS Provider | [Hosting dashboard] | Server issues |
| PostgreSQL | Check logs first, then provider | Database issues |
| Cloudflare | Dashboard or support ticket | CDN/DDoS issues |
| Razorpay | support@razorpay.com | Payment gateway issues |

---

## 8. Quick Reference Commands

```bash
# Status
pm2 status                          # PM2 worker status
pm2 monit                           # Real-time monitoring
curl -s http://localhost:3000/api/health | jq  # Health check
curl -s http://localhost:3000/api/metrics       # Prometheus metrics

# Logs
pm2 logs --lines 100                # Recent PM2 logs
pm2 logs --err --lines 50           # Error logs only
tail -f /var/log/nginx/error.log    # Nginx errors

# Restart
pm2 restart ecosystem.config.cjs    # Restart all workers
sudo systemctl reload nginx         # Reload Nginx config
sudo systemctl restart postgresql   # Restart database

# Cache
curl -sI https://vibemusic.in/ | grep X-Cache-Status  # Check Nginx cache
redis-cli ping                      # Check Redis
redis-cli INFO memory               # Redis memory usage

# Database
psql -U vibe -d vibe_music -c "SELECT count(*) FROM pg_stat_activity"  # Connections
psql -U vibe -d vibe_music -c "SELECT * FROM pg_stat_activity WHERE state = 'active'"  # Active queries

# Load test
npx tsx scripts/ops/load-test.mts --url http://127.0.0.1:3000 --concurrent 2000 --duration 60
```
