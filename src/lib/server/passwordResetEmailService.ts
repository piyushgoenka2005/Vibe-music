import "server-only";

import { BRAND } from "@/lib/brand";
import { formatMailboxFrom } from "@/lib/server/email/mailboxes";
import { sendMail } from "@/lib/server/email/smtp";

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? BRAND.siteUrl;

  const result = await sendMail({
    from: formatMailboxFrom("support"),
    to: email,
    replyTo: formatMailboxFrom("support"),
    subject: "Reset your Vibe Music password",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222">
        <p>You requested a password reset for your ${BRAND.name} account.</p>
        <p><a href="${resetUrl}" style="display:inline-block;background:#1a3a8f;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px">Reset your password</a></p>
        <p style="font-size:13px;color:#666">This link expires in one hour. If you did not request this, you can ignore this email.</p>
        <p style="font-size:13px;color:#666">— ${BRAND.name} (${siteUrl})</p>
      </div>
    `,
    text: `Reset your ${BRAND.name} password: ${resetUrl}\n\nThis link expires in one hour.`,
  });

  if (result.skipped) {
    console.error(
      `[auth] Password reset skipped — SMTP not configured (link not emailed): ${email}`
    );
    return false;
  }

  if (!result.ok) {
    console.error(`[auth] Password reset email failed for ${email}`);
    return false;
  }

  return true;
}
