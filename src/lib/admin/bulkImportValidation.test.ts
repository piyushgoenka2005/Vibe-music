import { describe, expect, it } from "vitest";
import { validateCsvFile, validateZipFile } from "@/lib/admin/bulkImportValidation";

function mockFile(name: string, size: number, type = ""): File {
  return { name, size, type } as File;
}

describe("bulkImportValidation", () => {
  it("accepts valid CSV files", () => {
    expect(validateCsvFile(mockFile("products.csv", 120, "text/csv"))).toBeNull();
  });

  it("rejects empty CSV", () => {
    expect(validateCsvFile(mockFile("empty.csv", 0, "text/csv"))).toMatch(/empty/i);
  });

  it("rejects non-csv extensions", () => {
    expect(validateCsvFile(mockFile("data.xlsx", 100, "application/vnd.ms-excel"))).toMatch(
      /\.csv/i,
    );
  });

  it("rejects a .txt upload even when the browser reports text/plain", () => {
    expect(validateCsvFile(mockFile("bad.txt", 120, "text/plain"))).toMatch(/\.csv/i);
  });

  it("accepts .csv files reported as text/plain or empty type", () => {
    expect(validateCsvFile(mockFile("products.csv", 120, "text/plain"))).toBeNull();
    expect(validateCsvFile(mockFile("products.csv", 120, ""))).toBeNull();
  });

  it("accepts valid ZIP files", () => {
    expect(validateZipFile(mockFile("images.zip", 5000, "application/zip"))).toBeNull();
  });

  it("rejects empty ZIP", () => {
    expect(validateZipFile(mockFile("images.zip", 0, "application/zip"))).toMatch(/empty/i);
  });
});
