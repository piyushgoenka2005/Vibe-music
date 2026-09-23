import { describe, expect, it } from "vitest";
import { getAuthErrorMessage } from "@/lib/auth/auth-errors";

describe("getAuthErrorMessage", () => {
  it("does not promise Google-alone linking for OAuthAccountNotLinked", () => {
    const message = getAuthErrorMessage("OAuthAccountNotLinked");
    expect(message.toLowerCase()).toContain("password");
    expect(message.toLowerCase()).not.toMatch(/try google again to link accounts/);
  });

  it("maps CredentialsSignin clearly", () => {
    expect(getAuthErrorMessage("CredentialsSignin")).toMatch(/invalid email or password/i);
  });

  it("maps totp_required clearly", () => {
    expect(getAuthErrorMessage("totp_required")).toMatch(/authenticator/i);
  });
});
