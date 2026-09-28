import { afterEach, describe, expect, it } from "vitest";
import { DELETE, GET } from "./route";

describe("/api/e2e/password-reset", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it("returns 404 in production (E2E mode off)", async () => {
    delete process.env.E2E_TEST_MODE;
    expect((await GET()).status).toBe(404);
    expect((await DELETE()).status).toBe(404);
  });

  it("allows access when E2E_TEST_MODE is enabled", async () => {
    process.env.E2E_TEST_MODE = "true";
    const res = await GET();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("No capture");
  });
});
