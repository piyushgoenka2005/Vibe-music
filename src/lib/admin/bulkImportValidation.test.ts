import { describe, expect, it } from "vitest";
import {
  validateCsvFile,
  validateSpreadsheetFile,
  validateZipFile,
} from "@/lib/admin/bulkImportValidation";

function mockFile(name: string, size: number, type = ""): File {
  return { name, size, type } as File;
}

describe("bulkImportValidation", () => {
  it("accepts valid CSV and Excel listing files", () => {
    expect(validateSpreadsheetFile(mockFile("products.csv", 120, "text/csv"))).toBeNull();
    expect(
      validateSpreadsheetFile(
        mockFile(
          "listing.xlsx",
          120,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ),
      ),
    ).toBeNull();
    expect(validateCsvFile(mockFile("products.csv", 120, "text/csv"))).toBeNull();
  });

  it("rejects empty listing files", () => {
    expect(validateSpreadsheetFile(mockFile("empty.csv", 0, "text/csv"))).toMatch(/empty/i);
  });

  it("rejects unsupported extensions", () => {
    expect(validateSpreadsheetFile(mockFile("bad.txt", 120, "text/plain"))).toMatch(
      /xlsx or \.csv/i,
    );
  });

  it("accepts .csv files reported as text/plain or empty type", () => {
    expect(validateSpreadsheetFile(mockFile("products.csv", 120, "text/plain"))).toBeNull();
    expect(validateSpreadsheetFile(mockFile("products.csv", 120, ""))).toBeNull();
  });

  it("accepts valid ZIP files", () => {
    expect(validateZipFile(mockFile("images.zip", 5000, "application/zip"))).toBeNull();
  });

  it("rejects empty ZIP", () => {
    expect(validateZipFile(mockFile("images.zip", 0, "application/zip"))).toMatch(/empty/i);
  });
});
