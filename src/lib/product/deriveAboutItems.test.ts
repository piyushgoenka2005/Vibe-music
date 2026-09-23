import { describe, expect, it } from "vitest";
import { deriveAboutItems } from "./deriveAboutItems";

describe("deriveAboutItems", () => {
  it("splits prose descriptions into about bullets", () => {
    const items = deriveAboutItems(
      "The Nord Stage 4 88 is a flagship performance keyboard. It combines piano, organ, and synth engines. Ideal for live performance.",
    );

    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0]?.body).toContain("flagship performance keyboard");
  });

  it("keeps explicit bullet lines from bulk import", () => {
    const items = deriveAboutItems("Feature one\nFeature two");

    expect(items).toEqual([
      { title: "", body: "Feature one" },
      { title: "", body: "Feature two" },
    ]);
  });

  it("combines intro paragraphs and feature blocks without duplicates", () => {
    const items = deriveAboutItems(
      "Premium sound for live performance.\n\nDeep Bass\nRich low-end response for live performance.",
    );

    expect(items).toEqual([
      { title: "", body: "Premium sound for live performance." },
      { title: "Deep Bass", body: "Rich low-end response for live performance." },
    ]);
  });

  it("drops repeated about items from duplicated import text", () => {
    const items = deriveAboutItems(
      "USB & Bluetooth Connectivity Supports easy connection.\nUSB & Bluetooth Connectivity Supports easy connection.",
    );

    expect(items).toHaveLength(1);
  });
});
