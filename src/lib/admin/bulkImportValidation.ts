export const MAX_CSV_BYTES = 5 * 1024 * 1024;
export const MAX_ZIP_BYTES = 50 * 1024 * 1024;

export function validateCsvFile(file: File): string | null {
  if (file.size <= 0) return "CSV file is empty.";
  if (file.size > MAX_CSV_BYTES) {
    return `CSV must be at most ${Math.round(MAX_CSV_BYTES / (1024 * 1024))} MB.`;
  }
  const name = file.name.toLowerCase();
  // Extension is authoritative (some OSes/browsers report .csv as text/plain
  // or an empty type), but never accept a non-CSV name just because the MIME
  // type is text/plain.
  const looksCsv = name.endsWith(".csv") || file.type.includes("csv");
  if (!looksCsv) return "Upload a .csv file.";
  return null;
}

export function validateZipFile(file: File): string | null {
  if (file.size <= 0) return "ZIP file is empty.";
  if (file.size > MAX_ZIP_BYTES) {
    return `ZIP must be at most ${Math.round(MAX_ZIP_BYTES / (1024 * 1024))} MB.`;
  }
  const name = file.name.toLowerCase();
  if (!name.endsWith(".zip") && !file.type.includes("zip")) {
    return "Upload a .zip file for images.";
  }
  return null;
}
