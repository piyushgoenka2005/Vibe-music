# VPS setup (vibemusic.in)

Server: `root@87.232.72.14`  
App path: `~/Vibe-music`  
PM2 app: `vibe`

**Database:** Self-hosted **PostgreSQL on this VPS** (`localhost:5432`). See [docs/POSTGRESQL.md](../docs/POSTGRESQL.md).

---

## One-command deploy (after SSH key works)

```bash
cd ~/Vibe-music && bash deploy/update.sh
```

Each deploy should run migrations:

```bash
cd ~/Vibe-music
npm ci
npm run db:migrate
npm run build
pm2 restart vibe
```

---

## PostgreSQL (first-time on VPS)

Install and create the database user (run once):

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib

sudo -u postgres psql <<'SQL'
CREATE USER vibe WITH PASSWORD 'your-strong-password';
CREATE DATABASE vibe OWNER vibe;
GRANT ALL PRIVILEGES ON DATABASE vibe TO vibe;
SQL
```

In `~/Vibe-music/.env` (never commit):

```env
DATABASE_URL=postgresql://vibe:your-strong-password@localhost:5432/vibe?schema=public
```

Apply schema:

```bash
cd ~/Vibe-music
npm run db:migrate
npm run seed:catalog    # optional first-time catalog seed
```

Verify:

```bash
curl -s http://127.0.0.1:3000/api/health | jq .
# expect checks.database: "ok"
```

Do **not** open port `5432` in UFW — Postgres is localhost-only.

---

## First-time hardening (run once on server)

From your PC, copy your public key:

```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519_vibe.pub
```

On the VPS:

```bash
cd ~/Vibe-music
git pull origin main
SSH_PUBLIC_KEY='paste-your-public-key-here' bash deploy/vps-hardening.sh
```

After key login works from a **second** terminal:

```bash
DISABLE_PASSWORD_AUTH=1 SSH_PUBLIC_KEY='same-key' bash deploy/vps-hardening.sh
passwd   # set a new strong root password
```

## SSH from Windows (password-free)

Add to `%USERPROFILE%\.ssh\config`:

```
Host vibe-vps
  HostName 87.232.72.14
  User root
  IdentityFile ~/.ssh/id_ed25519_vibe
  IdentitiesOnly yes
```

Then: `ssh vibe-vps`

## What hardening enables

| Item | Config |
|------|--------|
| Firewall | UFW: allow 22, 80, 443 only |
| SSH | Key auth; optional password disable |
| fail2ban | 5 tries / 10 min → 1 h ban |
| PM2 | Survives reboot |
| Updates | Unattended security upgrades |
| PostgreSQL | localhost only — not exposed publicly |

Never commit `.env`, passwords, or private keys to git.

## Release checklist

Before/after deploy, follow **`docs/DEPLOYMENT.md`** and **`docs/POSTGRESQL.md`**.

## Local validation before push

```bash
npm run validate        # type-check, lint, test, build
npm run db:migrate      # against local or VPS Postgres
npm run test:e2e        # with npm run dev or npm run start running
```
