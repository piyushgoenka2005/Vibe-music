import "server-only";

import { BRAND } from "@/lib/brand";
import { sendMail } from "@/lib/server/email/smtp";
import { getStoreSettings } from "@/lib/server/settingsService";

export async function sendAdminInviteEmail(input: {
  email: string;
  displayName: string;
  temporaryPassword?: string;
  mode: "created" | "promoted" | "reactivated";
}): Promise<{ sent: boolean; skipped?: boolean }> {
  const settings = await getStoreSettings();
  const loginUrl = `${BRAND.siteUrl}/admin/login`;
  const passwordBlock =
    input.mode === "created" && input.temporaryPassword
      ? `<p><strong>Temporary password:</strong> ${input.temporaryPassword}</p>
         <p>Change this password after your first sign-in.</p>`
      : input.mode === "promoted"
        ? "<p>Sign in with your existing storefront password, or the password set by your administrator.</p>"
        : "<p>Your admin access has been reactivated. Sign in with your existing credentials.</p>";

  const result = await sendMail({
    from: settings.storeEmail || BRAND.email,
    to: input.email,
    subject: `You're invited to ${settings.storeName} admin`,
    html: `
      <p>Hi ${input.displayName},</p>
      <p>You now have access to the <strong>${settings.storeName}</strong> admin panel.</p>
      ${passwordBlock}
      <p><a href="${loginUrl}">Sign in to admin</a></p>
      <p>If you did not expect this email, contact ${settings.storeEmail || BRAND.email}.</p>
    `,
    text: `You have admin access for ${settings.storeName}. Sign in: ${loginUrl}`,
  });

  return { sent: result.ok, skipped: result.skipped };
}
