# Cloudflare CDN Setup for Vibe Music

## Why Cloudflare

- **Global edge cache**: 300+ PoPs serve static assets from the nearest location (10-50ms vs 200-500ms from VPS)
- **Free tier**: Includes SSL, DDoS protection, basic caching, and bot management
- **Page Rules**: Cache HTML pages at edge for sub-100ms response times
- **Workers**: Optional edge compute for A/B testing, geolocation redirects

## Setup Steps

### 1. Add Domain to Cloudflare

1. Sign up at https://dash.cloudflare.com
2. Add `vibemusic.in`
3. Update nameservers at your registrar:
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```
4. Wait for DNS propagation (5-30 minutes)

### 2. SSL/TLS Settings

```
SSL/TLS encryption mode: Full (strict)
Always Use HTTPS: ON
Automatic HTTPS Rewrites: ON
Min TLS version: 1.2
```

### 3. Caching Configuration

#### Caching Level: Standard

```
Browser Cache TTL: Respect Existing Headers
Caching Level: Standard
Always Online: ON
```

#### Page Rules (Cache HTML at Edge)

Create these page rules in order (first match wins):

**Rule 1: Cache Homepage** (most traffic)
```
URL: vibemusic.in/
Setting: Cache Level → Cache Everything
Setting: Edge Cache TTL → 1 minute
Setting: Browser Cache TTL → 1 minute
```

**Rule 2: Cache Category Pages**
```
URL: vibemusic.in/category/*
Setting: Cache Level → Cache Everything
Setting: Edge Cache TTL → 1 minute
Setting: Browser Cache TTL → 1 minute
```

**Rule 3: Cache Product Pages**
```
URL: vibemusic.in/product/*
Setting: Cache Level → Cache Everything
Setting: Edge Cache TTL → 2 minutes
Setting: Browser Cache TTL → 2 minutes
```

**Rule 4: Cache Blog Pages**
```
URL: vibemusic.in/blog/*
Setting: Cache Level → Cache Everything
Setting: Edge Cache TTL → 2 minutes
Setting: Browser Cache TTL → 5 minutes
```

**Rule 5: Cache Static CMS Pages**
```
URL: vibemusic.in/pages/*
Setting: Cache Level → Cache Everything
Setting: Edge Cache TTL → 10 minutes
Setting: Browser Cache TTL → 1 hour
```

**Rule 6: Bypass API Routes** (CRITICAL — never cache API responses)
```
URL: *vibemusic.in/api/*
Setting: Cache Level → Bypass
```

**Rule 7: Bypass Auth/Checkout** (never cache dynamic user pages)
```
URL: *vibemusic.in/checkout*
Setting: Cache Level → Bypass
Setting: Disable Security → OFF
```

```
URL: *vibemusic.in/cart*
Setting: Cache Level → Bypass
```

```
URL: *vibemusic.in/account*
Setting: Cache Level → Bypass
```

```
URL: *vibemusic.in/admin*
Setting: Cache Level → Bypass
```

### 4. Performance Settings

```
Auto Minify: JavaScript ON, CSS ON, HTML ON
Brotli: ON
Rocket Loader: OFF (can break Next.js hydration)
Mirage: ON (lazy-load images on mobile)
Early Hints: ON
HTTP/2: ON (automatic)
HTTP/3 (QUIC): ON
0-RTT Connection Resumption: ON
```

### 5. Rules — Cache Rules (Newer Alternative to Page Rules)

If using Cache Rules (available on Free plan):

```yaml
# Rule: Cache public pages
Expression: (http.request.uri.path eq "/" or http.request.uri.path ~ "^/category/.*" or http.request.uri.path ~ "^/product/.*" or http.request.uri.path ~ "^/blog/.*" or http.request.uri.path ~ "^/pages/.*")
Action: Cache
Cache TTL: 60s
Edge TTL: 60s

# Rule: Bypass cache for logged-in users
Expression: http.cookie contains "vibe_session"
Action: Bypass Cache

# Rule: Bypass API routes
Expression: http.request.uri.path ~ "^/api/"
Action: Bypass Cache
```

### 6. Security Settings

```
Security Level: Medium
Challenge Passage: 30 minutes
Bot Fight Mode: ON
Under Attack Mode: OFF (enable during DDoS)
```

### 7. Origin Rules (If VPS Has No SSL)

If your VPS doesn't have SSL yet:

```
SSL/TLS → Overview → Full (strict)
```

This means Cloudflare terminates SSL and communicates with your VPS over HTTP on port 80.

If your VPS has SSL (recommended):

```
SSL/TLS → Overview → Full (strict)
Origin server name: vibemusic.in
```

## Expected Performance Impact

| Metric | Without CDN | With Cloudflare CDN |
|---|---|---|
| Homepage TTFB | 200-500ms | 20-50ms (edge hit) |
| Product page TTFB | 200-500ms | 30-80ms (edge hit) |
| Static assets | 50-100ms | 5-20ms (edge) |
| Global latency | 200-2000ms (depends on region) | 20-100ms (nearest PoP) |
| DDoS protection | None | Automatic |
| SSL | Manual (Let's Encrypt) | Automatic + universal |

## Cache Invalidation

When you update content, Cloudflare serves stale content until TTL expires. To force immediate update:

```bash
# Via API
curl -X POST "https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer {API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

# Or purge specific URLs
--data '{"files":["https://vibemusic.in/","https://vibemusic.in/category/guitars"]}'
```

## Monitoring

Check cache performance in Cloudflare Dashboard:
- **Analytics → Performance**: Cache hit ratio, bandwidth saved
- **Analytics → Security**: Threats blocked, bot requests
- **Speed → Optimization**: Load time improvements

## Cost

| Plan | Price | Features |
|---|---|---|
| Free | $0/mo | SSL, CDN, DDoS, basic caching |
| Pro | $20/mo | Image optimization, mobile optimization |
| Business | $200/mo | Custom SSL, 100% SLA |

**Recommendation**: Start with Free tier. Upgrade to Pro only if you need image optimization.
