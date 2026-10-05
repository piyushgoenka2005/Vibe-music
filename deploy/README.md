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

## Google sign-in (`deleted_client` / Error 401)

If shoppers see **“The OAuth client was deleted”** on [vibemusic.in/login](https://vibemusic.in/login):

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials?project=vibemusic2026) (project **vibemusic2026**).
2. **Create credentials → OAuth client ID → Web application**.
3. **Authorized JavaScript origins:** `https://vibemusic.in`, `https://www.vibemusic.in`
4. **Authorized redirect URIs:**
   - `https://vibemusic.in/api/auth/callback/google`
   - `https://www.vibemusic.in/api/auth/callback/google`
5. On the VPS, update `.env` (or merged secrets):
   - `AUTH_GOOGLE_ID=<new client id>`
   - `AUTH_GOOGLE_SECRET=<new client secret>`
6. Verify: `npm run verify:google-oauth` (on the server with production `.env`)
7. Redeploy: `bash deploy/update.sh`

The app hides the Google button when the client is deleted/invalid so shoppers are not sent to a broken Google screen.

## Meta Pixel + Instagram / Facebook ads

Storefront ad landing URLs and Open Graph metadata are served from canonical routes:

| Promote  | URL                                    |
| -------- | -------------------------------------- |
| Brand    | `https://vibemusic.in/brands/{slug}`   |
| Product  | `https://vibemusic.in/product/{slug}`  |
| Category | `https://vibemusic.in/category/{slug}` |
| Deals    | `https://vibemusic.in/deals`           |

Legacy `?brand=` links redirect automatically.

1. **Events Manager** → Data sources → Web → copy **Pixel ID** (numeric).
2. On the VPS, add to `deploy/ops-secrets.env`:
   ```bash
   NEXT_PUBLIC_META_PIXEL_ID=<pixel-id>
   ```
3. Redeploy: `bash deploy/update.sh`
4. Verify:
   ```bash
   npm run verify:meta-ad-landing:prod
   ```
5. In **Meta Sharing Debugger**, scrape `https://vibemusic.in/brands/gibraltar` and your product URL.
6. Update Instagram ad destination to `https://vibemusic.in/brands/gibraltar` (not `?brand=` query URLs).
