const BLOCKED_TAGS =
  /<\/?(?:script|iframe|object|embed|form|input|button|link|meta|base|style|svg|math|template|foreignObject)[^>]*>/gi;
const EVENT_HANDLERS =
  /\s(on\w+|formaction|xlink:href|xmlns:xlink)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_PROTOCOL =
  /(?:href|src|xlink:href|action|formaction)\s*=\s*("|')?\s*(?:javascript|vbscript|data):/gi;
const HTML_COMMENTS = /<!--[\s\S]*?-->/g;
const NULL_BYTES = /\0/g;

/**
 * Defensive HTML sanitizer for admin-authored CMS/blog/giveaway HTML.
 * Prefer allowlisted rich-text output from TipTap; this strips known XSS vectors.
 * Not a replacement for a full DOMPurify pipeline in high-threat multi-tenant HTML.
 */
export function sanitizeHtml(html: string): string {
  let out = html.replace(NULL_BYTES, "").replace(HTML_COMMENTS, "");
  // Iteratively strip blocked tags / handlers (nested encodings).
  for (let i = 0; i < 3; i += 1) {
    const next = out
      .replace(BLOCKED_TAGS, "")
      .replace(EVENT_HANDLERS, "")
      .replace(JS_PROTOCOL, "");
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
