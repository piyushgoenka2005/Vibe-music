import { describe, expect, it } from "vitest";
import {
  buildGuitarShowcaseRows,
  isGuitarProduct,
} from "@/lib/product/guitarShowcaseSpecs";

describe("buildGuitarShowcaseRows", () => {
  it("maps guitar spec labels to showcase rows", () => {
    const rows = buildGuitarShowcaseRows([
      { label: "Type", value: "SuperStrat" },
      { label: "Body", value: "Alder" },
      { label: "Neck", value: "Canadian Maple, Bolt-On" },
      { label: "Fingerboard", value: "Indian Rosewood, 22 Frets" },
      { label: "Scale Length", value: '25.5"' },
      { label: "Pickup", value: "H-S-S Korean" },
      { label: "Controls", value: "1 Volume, 2 Tone, Coil-Tap" },
      { label: "Pickup Selector", value: "5-Way" },
      { label: "Bridge", value: "6-Screw Tremolo" },
      { label: "Tuners & Hardware", value: "Die-Cast Classic, Chrome" },
    ]);

    expect(rows).toHaveLength(5);
    expect(rows[0]?.left?.value).toBe("SuperStrat");
    expect(rows[0]?.right?.value).toBe("Alder");
    expect(rows[4]?.right?.value).toBe("Die-Cast Classic, Chrome");
  });

  it("supports label aliases", () => {
    const rows = buildGuitarShowcaseRows([
      { label: "Fretboard", value: "Maple" },
      { label: "Pickups", value: "H-H" },
    ]);

    expect(rows[1]?.right?.value).toBe("Maple");
    expect(rows[2]?.right?.value).toBe("H-H");
  });

  it("always returns all showcase rows with placeholders", () => {
    const rows = buildGuitarShowcaseRows([]);

    expect(rows).toHaveLength(5);
    expect(rows[0]?.left?.value).toBe("—");
    expect(rows[0]?.right?.value).toBe("—");
  });
});

describe("isGuitarProduct", () => {
  it("detects guitar category products", () => {
    expect(isGuitarProduct("guitars", "Guitars")).toBe(true);
    expect(isGuitarProduct("drums-percussion", "Drums")).toBe(false);
  });
});
