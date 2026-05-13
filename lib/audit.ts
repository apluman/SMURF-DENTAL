import { createAdminClient } from "./supabase/admin";

export async function auditLog({
  userId,
  action,
  resourceType,
  resourceId,
  metadata,
  ipAddress,
}: {
  userId: string;
  action: string;
  resourceType?: string | undefined;
  resourceId?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  ipAddress?: string | undefined;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_log").insert({
      user_id: userId,
      action,
      resource_type: resourceType ?? null,
      resource_id: resourceId ?? null,
      metadata: metadata ?? null,
      ip_address: ipAddress ?? null,
    });
  } catch (err) {
    console.error("[audit] Failed to write log:", err);
  }
}

export function getIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return request.headers.get("x-real-ip") ?? undefined;
}
