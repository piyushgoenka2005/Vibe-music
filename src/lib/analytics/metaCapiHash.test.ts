import { describe, expect, it } from "vitest";
import { hashMetaEmail, hashMetaPhone } from "@/lib/analytics/metaCapiHash";

describe("metaCapiHash", () => {
  it("hashes normalized email", () => {
    const a = hashMetaEmail("Test@Example.com");
    const b = hashMetaEmail("test@example.com");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("hashes Indian phone numbers with country code", () => {
    const mobile = hashMetaPhone("8910482950");
    const prefixed = hashMetaPhone("918910482950");
    expect(mobile).toBe(prefixed);
  });
});
