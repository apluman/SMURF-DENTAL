import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user : null;
}

export async function GET(request: Request) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const dentistId = searchParams.get("dentist_id");
  if (!dentistId) return NextResponse.json({ error: "dentist_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("schedules")
    .select("*")
    .eq("dentist_id", dentistId)
    .order("day_of_week");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

const scheduleSchema = z.object({
  dentist_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
});

export async function POST(request: Request) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = scheduleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { dentist_id, day_of_week, start_time, end_time } = parsed.data;
  const admin = createAdminClient();
  const { error } = await admin.from("schedules").upsert(
    { dentist_id, day_of_week, start_time, end_time, is_active: true },
    { onConflict: "dentist_id,day_of_week" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

const deleteSchema = z.object({
  dentist_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
});

export async function DELETE(request: Request) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { dentist_id, day_of_week } = parsed.data;
  const admin = createAdminClient();
  const { error } = await admin
    .from("schedules")
    .delete()
    .eq("dentist_id", dentist_id)
    .eq("day_of_week", day_of_week);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
