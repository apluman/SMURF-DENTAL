import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auditLog, getIp } from "@/lib/audit";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return { admin, userId: user.id };
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin();
  if (!result) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { admin, userId } = result;

  const { id } = await params;

  const { error } = await admin
    .from("profiles")
    .update({ role: "patient" })
    .eq("id", id)
    .eq("role", "receptionist");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auditLog({
    userId,
    action: "receptionist.removed",
    resourceType: "profile",
    resourceId: id,
    ipAddress: getIp(request),
  });

  return NextResponse.json({ success: true });
}
