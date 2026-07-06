function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const LONG_TITLE_BREAKS = [
  /\s+with\s+/i,
  /\s+featuring\s+/i,
  /\s+for\s+(?:dj|karaoke|studio|live|home|professional|beginners?|musicians?|performers?|recording)\b/i,
  /,\s*/,
];

/** Short card title — brand shown separately; full name stays on PDP via `title`. */
export function formatProductCardTitle(
  name: string,
  brand?: string,
  maxLength = 64
): string {
  let title = name.trim();
  if (!title) return "";

  if (brand) {
    const pattern = new RegExp(`^${escapeRegExp(brand.trim())}\\s+`, "i");
    title = title.replace(pattern, "").trim();
  }

  if (title.length > 36) {
    for (const pattern of LONG_TITLE_BREAKS) {
      const match = pattern.exec(title);
      if (match && match.index >= 12) {
        title = title.slice(0, match.index).trim();
        break;
      }
    }
  }

  if (title.length > maxLength) {
    const slice = title.slice(0, maxLength);
    const lastSpace = slice.lastIndexOf(" ");
    title = `${(lastSpace > 28 ? slice.slice(0, lastSpace) : slice).trim()}…`;
  }

  return title;
}
