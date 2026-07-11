import "server-only";

import { prisma } from "@/lib/db/prisma";
import { asJsonValue } from "@/lib/server/prisma/mappers";
import { getClientIp } from "@/lib/security/rate-limit-core";
import { getRequestId } from "@/lib/security/request-log";
import { logInfo } from "@/lib/server/logger";

export const AUDIT_LOGS_COLLECTION = "auditLogs";

export interface AuditLogInput {
  action: string;
  actorId?: string;
  actorEmail?: string;
  resourceType?: string;
  resourceId?: string;
  request?: Request;
  metadata?: Record<string, unknown>;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  actorId: string | null;
  actorEmail: string | null;
  resourceType: string | null;
  resourceId: string | null;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export async function listRecentAuditLogs(
  limit = 100
): Promise<AuditLogRecord[]> {
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    actorId: row.actorId || null,
    actorEmail: row.actorEmail || null,
    resourceType: row.resourceType || null,
    resourceId: row.resourceId || null,
    ip: row.ip || null,
    userAgent: row.userAgent || null,
    requestId: row.requestId || null,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : null,
    createdAt: row.createdAt,
  }));
}

export async function logAuditEvent(input: AuditLogInput): Promise<void> {
  const request = input.request;
  const record = {
    action: input.action,
    actorId: input.actorId ?? "",
    actorEmail: input.actorEmail ?? "",
    resourceType: input.resourceType ?? "",
    resourceId: input.resourceId ?? "",
    ip: request ? getClientIp(request) : "",
    userAgent: request?.headers.get("user-agent") ?? "",
    requestId: request ? getRequestId(request) : "",
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString(),
  };

  logInfo("Audit event", "audit", record);

  try {
    await prisma.auditLog.create({
      data: {
        action: record.action,
        actorId: record.actorId,
        actorEmail: record.actorEmail,
        resourceType: record.resourceType,
        resourceId: record.resourceId,
        ip: record.ip,
        userAgent: record.userAgent,
        requestId: record.requestId,
        metadata: asJsonValue(record.metadata),
        createdAt: record.createdAt,
      },
    });
  } catch (error) {
    logInfo("Audit log persistence failed", "audit", {
      action: input.action,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
