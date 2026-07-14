import "server-only";

import type { FinanceApplication } from "@/types/finance";
import { sendMail } from "@/lib/server/email/smtp";
import { formatMailboxFrom } from "@/lib/server/email/mailboxes";
import { logInfo } from "@/lib/server/logger";
import { formatCurrency } from "@/utils/currency";

type FinanceEmailEvent = "submitted" | "approved" | "rejected";

function subjectFor(event: FinanceEmailEvent, app: FinanceApplication): string {
  if (event === "submitted") return `Finance application received — ${app.applicationNumber}`;
  if (event === "approved") return `Finance application approved — ${app.applicationNumber}`;
  return `Finance application update — ${app.applicationNumber}`;
}

function bodyFor(event: FinanceEmailEvent, app: FinanceApplication): string {
  const lines = [
    `Hello ${app.customerName},`,
    "",
    `Application: ${app.applicationNumber}`,
    `Product: ${app.productName}`,
    `Order value: ${formatCurrency(app.orderValue)}`,
    `EMI: ${formatCurrency(app.monthlyInstallment)}/month × ${app.tenureMonths} months`,
    `Status: ${app.status}`,
    "",
  ];
  if (event === "submitted") {
    lines.push("We received your finance application and will review it shortly.");
  } else if (event === "approved") {
    lines.push("Your finance application has been approved. Our team will contact you for next steps.");
  } else {
    lines.push(app.rejectionReason ? `Reason: ${app.rejectionReason}` : "Your application was not approved.");
  }
  lines.push("", "— Vibe Music Financing");
  return lines.join("\n");
}

export async function sendFinanceApplicationEmail(
  application: FinanceApplication,
  event: FinanceEmailEvent
): Promise<void> {
  try {
    const text = bodyFor(event, application);
    await sendMail({
      from: formatMailboxFrom("orders"),
      to: application.email,
      subject: subjectFor(event, application),
      html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${text}</pre>`,
      text,
    });
  } catch (error) {
    logInfo("Finance email failed", "finance-email", {
      applicationId: application.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
