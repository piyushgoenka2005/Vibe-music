# Origin IP protection (L-23)

CDN/WAF (L-22) only protects traffic that actually goes through the edge. If the VPS origin IP is discoverable, attackers can bypass Cloudflare.

## Verify exposure

1. Check current DNS: `dig +short vibemusic.in A`
2. Review historical DNS (SecurityTrails, ViewDNS) for bare VPS IPs.
3. Compare with Cloudflare proxy IPs — if they match your VPS, DNS is not proxied.

## Remediation

1. Enable **orange-cloud (proxied)** DNS for `vibemusic.in` and `www`.
2. **Rotate** the VPS public IP if it was ever exposed directly.
3. **Firewall** the origin (UFW / cloud security group):
   - Allow `80`/`443` only from [Cloudflare IP ranges](https://www.cloudflare.com/ips/).
   - Allow SSH only from your admin IP.
4. Re-run `npm run check:edge` — expect `cf-ray` on responses.

## Ongoing

- Never publish the origin IP in docs, emails, or MX records pointing at the app server.
- Use a separate mail host or transactional provider (Resend/SMTP) — not the storefront VPS.
