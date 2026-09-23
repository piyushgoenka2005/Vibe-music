import { CredentialsSignin } from "next-auth";

/** Thrown when password is valid but admin 2FA code is required. */
export class TotpRequiredError extends CredentialsSignin {
  code = "totp_required";
}
