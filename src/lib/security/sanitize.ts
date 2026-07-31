const BLOCKED_TAGS =
  /<\/?(?:script|iframe|object|embed|form|input|button|link|meta|base|style|svg|math|template|foreignObject|textarea|select|option|noscript|applet|frame|frameset)[^>]*>/gi;
const EVENT_HANDLERS =
  /\s(on\w+|formaction|xlink:href|xmlns:xlink|srcdoc)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_PROTOCOL =
  /(?:href|src|xlink:href|action|formaction|poster)\s*=\s*("|')?\s*(?:javascript|vbscript|data\s*:\s*text\/html):/gi;
const HTML_COMMENTS = /<!--[\s\S]*?-->/g;
const NULL_BYTES = /\0/g;
const DANGEROUS_CSS_EXPRESSION =
  /expression\s*\(|url\s*\(\s*["']?\s*javascript:/gi;

/**
 * Defensive HTML sanitizer for admin-authored CMS/blog/giveaway HTML.
 * Prefer allowlisted rich-text output from TipTap; this strips known XSS vectors.
 * Not a replacement for a full DOMPurify pipeline in high-threat multi-tenant HTML.
 */
export function sanitizeHtml(html: string): string {
  let out = html.replace(NULL_BYTES, "").replace(HTML_COMMENTS, "");
  for (let i = 0; i < 5; i += 1) {
    const next = out
      .replace(BLOCKED_TAGS, "")
      .replace(EVENT_HANDLERS, "")
      .replace(JS_PROTOCOL, "")
      .replace(DANGEROUS_CSS_EXPRESSION, "");
    if (next === out) break;
    out = next;
  }
  return out;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
