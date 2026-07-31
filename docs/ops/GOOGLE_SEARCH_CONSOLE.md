# Google Search Console — Connect ViBE Music

Production site: https://vibemusic.in

## Already live (no code change needed)

| Asset | URL |
|-------|-----|
| robots.txt | https://vibemusic.in/robots.txt |
| sitemap.xml | https://vibemusic.in/sitemap.xml |

## Wire ownership verification (required once)

1. Open [Google Search Console](https://search.google.com/search-console) → **Add property** → URL prefix `https://vibemusic.in`
2. Choose **HTML tag** verification.
3. Copy only the `content="…"` token value (not the full meta tag).
4. On the VPS, set in the app env file:

```bash
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=PASTE_TOKEN_HERE
```

5. Redeploy / restart PM2 (`bash deploy/update.sh` or `pm2 restart vibe --update-env`).
6. Click **Verify** in Search Console.
7. **Sitemaps** → submit `https://vibemusic.in/sitemap.xml`

## After this PR is deployed

Root metadata emits:

```html
<meta name="google-site-verification" content="…" />
```

when the env var is set. Homepage also includes Organization + WebSite JSON-LD (SearchAction).

## Optional (DNS)

You may verify via DNS TXT at your domain registrar instead of the HTML tag; then the env var is unnecessary.
