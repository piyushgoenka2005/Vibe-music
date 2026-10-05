import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  deleteNewsletterSubscriber,
  listNewsletterSubscriberPage,
  listNewsletterSubscribers,
  updateNewsletterSubscriber,
} from "@/lib/server/newsletterRepository";
import { logAuditEvent } from "@/lib/server/auditLog";
import {
  adminNewsletterCreateSchema,
  adminNewsletterDeleteQuerySchema,
  adminNewsletterPatchSchema,
} from "@/lib/validations/admin";
import { subscribeToNewsletter } from "@/lib/server/newsletterRepository";

export async function GET(request: Request) {
  try {
    await requireAdmin("customers:read");
    const { searchParams } = new URL(request.url);

    // CSV export intentionally stays complete — pagination is view-only.
    if (searchParams.get("export") === "csv") {
      const subscribers = await listNewsletterSubscribers();
      const header = "email,firstName,lastName,marketing,subscribedAt,source\n";
      const rows = subscribers
        .map((s) =>
          [
            s.email,
            s.firstName ?? "",
            s.lastName ?? "",
            s.marketing ? "true" : "false",
            s.subscribedAt,
            s.source,
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n");
      return new NextResponse(header + rows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="newsletter-subscribers.csv"',
        },
      });
    }

    const page = await listNewsletterSubscriberPage({
      limit: Number(searchParams.get("limit") ?? 20),
      afterSubscribedAt: searchParams.get("cursor") ?? undefined,
    });

    return NextResponse.json(page);
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin("customers:write", request);
    const body = await request.json();
    const parsed = adminNewsletterCreateSchema.parse(body);
    const result = await subscribeToNewsletter({
      email: parsed.email,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      marketing: parsed.marketing ?? true,
    });
    await logAuditEvent({
      action: "newsletter.subscriber.created",
      actorId: admin.uid,
      actorEmail: admin.email,
      resourceType: "newsletter_subscriber",
      resourceId: parsed.email.trim().toLowerCase(),
      request,
      metadata: { created: result.created },
    });
    return NextResponse.json({ ok: true, created: result.created });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin("customers:write", request);
    const parsed = adminNewsletterPatchSchema.parse(await request.json());
    const subscriber = await updateNewsletterSubscriber(parsed.email, {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      marketing: parsed.marketing,
    });
    if (!subscriber) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }
    await logAuditEvent({
      action: "newsletter.subscriber.updated",
      actorId: admin.uid,
      actorEmail: admin.email,
      resourceType: "newsletter_subscriber",
      resourceId: parsed.email.trim().toLowerCase(),
      request,
    });
    return NextResponse.json({ subscriber });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin("customers:write", request);
    const { searchParams } = new URL(request.url);
    const { email } = adminNewsletterDeleteQuerySchema.parse({
      email: searchParams.get("email"),
    });
    const deleted = await deleteNewsletterSubscriber(email);
    if (!deleted) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }
    await logAuditEvent({
      action: "newsletter.subscriber.deleted",
      actorId: admin.uid,
      actorEmail: admin.email,
      resourceType: "newsletter_subscriber",
      resourceId: email,
      request,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
