import { describe, expect, it } from "vitest";
import {
  getQuickPreviewSpecs,
  getSizeAndFitSpecs,
  getStyleSpec,
  groupProductSpecs,
} from "./groupProductSpecs";

describe("groupProductSpecs", () => {
  it("groups specs into Amazon-style sections", () => {
    const groups = groupProductSpecs([
      { label: "Brand", value: "Yamaha" },
      { label: "Connectivity", value: "Bluetooth" },
      { label: "Connector Type", value: "USB-C" },
      { label: "Item Weight", value: "4.2 kg" },
      { label: "Warranty", value: "1 Year" },
      { label: "Number of Keys", value: "88" },
    ]);

    expect(groups.map((group) => group.id)).toEqual(
      expect.arrayContaining(["keyboard-performance", "physical", "connectivity", "item-details"]),
    );
    expect(groups).toHaveLength(4);
    expect(groups.find((group) => group.id === "connectivity")?.specs).toEqual([
      { label: "Connectivity", value: "Bluetooth" },
      { label: "Connector Type", value: "USB-C" },
    ]);
  });

  it("returns quick preview specs with brand first", () => {
    const preview = getQuickPreviewSpecs(
      [
        { label: "Warranty", value: "1 Year" },
        { label: "Model Name", value: "P-125" },
        { label: "Color", value: "Black" },
      ],
      "Yamaha",
      3,
    );

    expect(preview).toEqual([
      { label: "Brand", value: "Yamaha" },
      { label: "Model Name", value: "P-125" },
      { label: "Color", value: "Black" },
    ]);
  });

  it("resolves style spec from common labels", () => {
    expect(
      getStyleSpec([
        { label: "Model Year", value: "2026" },
        { label: "Color", value: "Black" },
      ]),
    ).toEqual({ label: "Model Year", value: "2026" });
  });

  it("extracts size and fit specs", () => {
    expect(
      getSizeAndFitSpecs([
        { label: "Size", value: "Full" },
        { label: "Brand", value: "Roland" },
      ]),
    ).toEqual([{ label: "Size", value: "Full" }]);
  });
});
