# Footer Trending reveal — master audit (2026-07-15)

## Symptom
On mobile homepage, scrolling through **Inside Vibe Music** into the navy band showed an empty blue void. **Trending at Vibe Music** products intermittently missing.

## Root cause
`SiteFooter` used `IntersectionObserver` on **`.site-footer__shell` only** with `threshold: 0.08`.

1. Shell enters view → panel gets `.is-ready` → Trending becomes visible (fixed under shell).
2. User keeps scrolling into the **spacer** (intended reveal zone) → shell leaves the viewport.
3. Observer flips ready **off** → CSS `.footer-products-panel:not(.is-ready) { visibility: hidden }` hides the panel.
4. Spacer navy (`#0d2d7e`) remains → empty blue screen. Products never appear.

API `/api/products/footer-trending` was healthy; data was not the issue.

## Required behavior (coordinated layers)
| Layer | Role |
|-------|------|
| Tour ribbon | Stays attached above Inside Vibe Music (seam CSS). |
| Inside Vibe Music shell | Scrolls over the fixed Trending panel. |
| Spacer | Matches panel height so Trending can be revealed. |
| Trending panel | Stays `.is-ready` for the **entire** footer (shell + spacer); becomes `.is-interactive` after the shell mostly exits. |

## Fix
- Observe the **whole footer** (shell + spacer), not the shell alone.
- Keep spacer height synced to panel (min fallback until products paint).
- Do not collapse ready-state mid-reveal.
