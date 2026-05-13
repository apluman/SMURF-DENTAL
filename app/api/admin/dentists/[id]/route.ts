import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auditLog, getIp } from "@/lib/audit";
import { NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  specialization: z.string().min(2),
  bio: z.string().optional(),
});

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return { admin, userId: user.id };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin();
  if (!result) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { admin } = result;

  const { id } = await params;
  const body: unknown = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await admin
    .from("dentists")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin();
  if (!result) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { admin, userId } = result;

  const { id } = await params;

  const { data: dentist } = await admin.from("dentists").select("profile_id").eq("id", id).single();

  const { error } = await admin.from("dentists").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (dentist?.profile_id) {
    await admin.from("profiles").update({ role: "patient" }).eq("id", dentist.profile_id);
  }

  await auditLog({
    userId,
    action: "dentist.removed",
    resourceType: "dentist",
    resourceId: id,
    metadata: { profile_id: dentist?.profile_id },
    ipAddress: getIp(request),
  });

  return NextResponse.json({ success: true });
}
