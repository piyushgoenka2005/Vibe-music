import { describe, expect, it, afterEach } from "vitest";
import {
  evaluateCodEligibility,
  getCodPolicy,
} from "@/lib/server/codEligibility";

describe("codEligibility", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it("allows COD by default under the max order value", () => {
    delete process.env.COD_ENABLED;
    delete process.env.COD_MAX_ORDER_VALUE;
    delete process.env.COD_ALLOWED_PIN_PREFIXES;

    const result = evaluateCodEligibility({
      orderValue: 10_000,
      postalCode: "400001",
    });
    expect(result.eligible).toBe(true);
    expect(getCodPolicy().maxOrderValue).toBe(50_000);
  });

  it("blocks COD when disabled", () => {
    process.env.COD_ENABLED = "false";
    const result = evaluateCodEligibility({
      orderValue: 1_000,
      postalCode: "400001",
    });
    expect(result.eligible).toBe(false);
  });

  it("blocks COD over max order value", () => {
    process.env.COD_MAX_ORDER_VALUE = "5000";
    const result = evaluateCodEligibility({
      orderValue: 5001,
      postalCode: "400001",
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/5,000/);
  });

  it("blocks COD outside allowed PIN prefixes", () => {
    process.env.COD_ALLOWED_PIN_PREFIXES = "110,700";
    const result = evaluateCodEligibility({
      orderValue: 1_000,
      postalCode: "400001",
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/PIN/i);
  });

  it("allows COD for matching PIN prefixes", () => {
    process.env.COD_ALLOWED_PIN_PREFIXES = "400,110";
    const result = evaluateCodEligibility({
      orderValue: 1_000,
      postalCode: "400001",
    });
    expect(result.eligible).toBe(true);
  });
});
