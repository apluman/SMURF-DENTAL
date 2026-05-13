import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auditLog, getIp } from "@/lib/audit";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  profile_id: z.string().uuid(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body: unknown = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { error } = await admin
    .from("profiles")
    .update({ role: "receptionist" })
    .eq("id", parsed.data.profile_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auditLog({
    userId: user.id,
    action: "receptionist.added",
    resourceType: "profile",
    resourceId: parsed.data.profile_id,
    ipAddress: getIp(request),
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
