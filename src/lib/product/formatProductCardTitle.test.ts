import { describe, expect, it } from "vitest";
import { formatProductCardTitle } from "@/lib/product/formatProductCardTitle";

describe("formatProductCardTitle", () => {
  it("strips brand prefix and shortens long keyword-stuffed names", () => {
    const longName =
      "HERTZ HZ STMP-X SuperStrat Electric Guitar Okoume Body Canadian Maple Neck Indian Rosewood Fingerboard 22 Frets";
    const title = formatProductCardTitle(longName, "HERTZ");
    expect(title.length).toBeLessThanOrEqual(48);
    expect(title).not.toMatch(/^HERTZ/i);
  });

  it("breaks at natural separators before hard truncation", () => {
    const name = "Adeon ADM01 Professional Mixer with DSP Control for Live Events";
    const title = formatProductCardTitle(name, "Adeon");
    expect(title).not.toContain("with DSP");
  });
});
