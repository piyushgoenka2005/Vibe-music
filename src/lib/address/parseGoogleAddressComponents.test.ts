import { describe, expect, it } from "vitest";
import { parseGoogleAddressComponents } from "@/lib/address/parseGoogleAddressComponents";

describe("parseGoogleAddressComponents", () => {
  it("maps India address components into checkout fields", () => {
    const parsed = parseGoogleAddressComponents(
      [
        { long_name: "12", short_name: "12", types: ["street_number"] },
        { long_name: "Linking Road", short_name: "Linking Rd", types: ["route"] },
        {
          long_name: "Bandra West",
          short_name: "Bandra West",
          types: ["sublocality_level_1", "sublocality"],
        },
        { long_name: "Mumbai", short_name: "Mumbai", types: ["locality"] },
        {
          long_name: "Maharashtra",
          short_name: "MH",
          types: ["administrative_area_level_1"],
        },
        { long_name: "400050", short_name: "400050", types: ["postal_code"] },
        { long_name: "India", short_name: "IN", types: ["country"] },
      ],
      { formattedAddress: "12 Linking Road, Bandra West, Mumbai, Maharashtra 400050, India" }
    );

    expect(parsed.line1).toBe("12 Linking Road");
    expect(parsed.line2).toBe("Bandra West");
    expect(parsed.city).toBe("Mumbai");
    expect(parsed.state).toBe("Maharashtra");
    expect(parsed.postalCode).toBe("400050");
    expect(parsed.country).toBe("India");
  });

  it("normalizes NCT of Delhi to Delhi", () => {
    const parsed = parseGoogleAddressComponents([
      {
        long_name: "NCT of Delhi",
        short_name: "DL",
        types: ["administrative_area_level_1"],
      },
      { long_name: "110001", short_name: "110001", types: ["postal_code"] },
    ]);
    expect(parsed.state).toBe("Delhi");
  });
});
