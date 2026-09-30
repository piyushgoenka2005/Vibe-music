# Deploy

Minimal production deploy for **vibemusic.in**.

| File                                                 | Purpose                                                         |
| ---------------------------------------------------- | --------------------------------------------------------------- |
| [`update.sh`](update.sh)                             | Main deploy: pull → migrate → build → PM2 → nginx → SSL → smoke |
| [`production.sh`](production.sh)                     | Nginx, compliance, certify, rollback, SSL, verify-sync          |
| [`fix-ssl-certificates.sh`](fix-ssl-certificates.sh) | Repair Let's Encrypt + nginx TLS on VPS                         |
| [`ecosystem.config.cjs`](ecosystem.config.cjs)       | PM2 process config                                              |
| [`ops-secrets.env.example`](ops-secrets.env.example) | Secrets template → `deploy/ops-secrets.env`                     |
| [`deploy_key.pub`](deploy_key.pub)                   | GitHub Actions deploy SSH public key                            |

```bash
cd ~/Vibe-music
bash deploy/update.sh
bash deploy/production.sh certify
bash deploy/production.sh rollback
```
