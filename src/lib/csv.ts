export interface ParsedCsvRow {
  [key: string]: string;
}

export function parseCsv(text: string): ParsedCsvRow[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length === 0) return [];

  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const rows: ParsedCsvRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCsvLine(line);
    const row: ParsedCsvRow = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] ?? "").trim();
    });
    rows.push(row);
  }

  return rows;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

export function rowsToCsv(headers: string[], rows: ParsedCsvRow[]): string {
  const escape = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const lines = [headers.join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((h) => escape(row[h] ?? "")).join(","));
  });
  return lines.join("\n");
}

export function csvRowToImportRow(row: ParsedCsvRow) {
  return {
    name: row.name ?? "",
    brand: row.brand ?? "",
    category: row.category ?? "",
    subcategory: row.subcategory ?? "",
    price: Number(row.price),
    originalPrice: row.originalPrice ? Number(row.originalPrice) : undefined,
    stock: row.stock ? Number(row.stock) : undefined,
    sku: row.sku ?? "",
    description: row.description ?? "",
    featured: row.featured ?? "",
    trending: row.trending ?? "",
    newArrival: row.newArrival ?? "",
    image1: row.image1 ?? "",
    image2: row.image2 ?? "",
    image3: row.image3 ?? "",
  };
}
