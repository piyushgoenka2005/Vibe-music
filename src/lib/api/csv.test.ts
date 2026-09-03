import { describe, it, expect } from "vitest";
import { escapeCsvCell, toCsv } from "./csv";

describe("escapeCsvCell", () => {
  it("leaves plain values untouched", () => {
    expect(escapeCsvCell("abc")).toBe("abc");
    expect(escapeCsvCell(123)).toBe("123");
    expect(escapeCsvCell("")).toBe("");
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });

  it("quotes values containing commas or quotes", () => {
    expect(escapeCsvCell("a,b")).toBe('"a,b"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("neutralizes spreadsheet formula injection", () => {
    expect(escapeCsvCell("=cmd()")).toBe('"=cmd()"');
    expect(escapeCsvCell("+SUM(A1)")).toBe('"+SUM(A1)"');
    expect(escapeCsvCell("-1+1")).toBe('"-1+1"');
    expect(escapeCsvCell("@import")).toBe('"@import"');
  });

  it("leaves ordinary leading characters alone", () => {
    expect(escapeCsvCell("John Doe")).toBe("John Doe");
    expect(escapeCsvCell("mail@example.com")).toBe("mail@example.com");
  });
});

describe("toCsv", () => {
  it("serializes header and rows with a trailing newline", () => {
    const csv = toCsv(
      ["id", "name"],
      [
        ["1", "A, B"],
        ["2", "=danger()"],
      ],
    );
    expect(csv).toBe('id,name\n1,"A, B"\n2,"=danger()"\n');
  });
});
