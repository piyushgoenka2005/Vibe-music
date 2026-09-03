/**
 * CSV cell escaping + serialization.
 *
 * - Cells containing commas, quotes, or newlines are double-quoted.
 * - Embedded quotes are doubled (RFC 4180).
 * - Cells whose first character is a formula trigger (= + - @ or control
 *   chars) are quoted so spreadsheet apps never evaluate them (CSV formula
 *   injection).
 */

export function escapeCsvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(text) || /^[=+\-@\t\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Serialize a header row + data rows into RFC-4180-ish CSV text. */
export function toCsv(header: string[], rows: unknown[][]): string {
  const encode = (cells: unknown[]) => cells.map(escapeCsvCell).join(",");
  return [encode(header), ...rows.map(encode)].join("\n") + "\n";
}
