import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auditLog, getIp } from "@/lib/audit";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: callerProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (callerProfile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // Prevent deleting own account or other admins
  if (id === user.id) return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });

  const { data: target } = await admin.from("profiles").select("role, full_name, email").eq("id", id).single();
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.role === "admin") return NextResponse.json({ error: "Cannot delete admin accounts" }, { status: 400 });

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auditLog({
    userId: user.id,
    action: "user.deleted",
    resourceType: "profile",
    resourceId: id,
    metadata: { deleted_name: target.full_name, deleted_email: target.email, deleted_role: target.role },
    ipAddress: getIp(request),
  });

  return NextResponse.json({ success: true });
}
