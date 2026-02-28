import { Request } from "express";
import { prisma } from "../lib/prisma";

export type AuditModule = "fee" | "admission" | "due" | "due_settings";

interface AuditLogParams {
  req: Request;
  action: string;
  module: AuditModule;
  entityType?: string;
  entityId?: string | number;
  details?: Record<string, any>;
  userId?: number;
}

/**
 * Extract user ID from the request.
 * Works with both JWT-authenticated requests and body-supplied userId.
 */
function extractUserId(req: Request, fallbackUserId?: number): number | null {
  // JWT-authenticated user
  const authUser = (req as any).user as
    | { userId?: number; id?: number }
    | undefined;
  if (authUser?.userId) return authUser.userId;
  if (authUser?.id) return authUser.id;

  // Fallback: explicit userId from caller
  if (fallbackUserId) return fallbackUserId;

  // Fallback: userId in request body
  if (req.body?.userId) return Number(req.body.userId);

  return null;
}

/**
 * Extract client IP address from the request.
 */
function extractIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0];
  return req.socket?.remoteAddress || "unknown";
}

/**
 * Log an audit event. This is fire-and-forget — errors are logged but
 * never bubble up to the caller so they can't break the main workflow.
 */
export async function logAudit({
  req,
  action,
  module,
  entityType,
  entityId,
  details,
  userId,
}: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: extractUserId(req, userId),
        action,
        module,
        entityType: entityType || null,
        entityId: entityId != null ? String(entityId) : null,
        details: details ? (details as any) : undefined,
        ipAddress: extractIp(req),
        userAgent: req.headers["user-agent"] || null,
      },
    });
  } catch (err) {
    console.error("[AuditLog] Failed to write audit log:", err);
  }
}
