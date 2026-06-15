const BLOCKED_TAGS =
  /<\/?(?:script|iframe|object|embed|form|input|button|link|meta|base|style)[^>]*>/gi;
const EVENT_HANDLERS = /\s(on\w+|formaction|xlink:href)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_PROTOCOL = /(?:href|src|xlink:href)\s*=\s*("|')?\s*javascript:/gi;

export function sanitizeHtml(html: string): string {
  return html
    .replace(BLOCKED_TAGS, "")
    .replace(EVENT_HANDLERS, "")
    .replace(JS_PROTOCOL, "");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
