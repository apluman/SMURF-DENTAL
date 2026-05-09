import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  dentist_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
});

const deleteSchema = z.object({
  dentist_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const admin = createAdminClient();

  // Verify the dentist belongs to this user
  const { data: dentist } = await admin
    .from("dentists")
    .select("id")
    .eq("id", parsed.data.dentist_id)
    .eq("profile_id", user.id)
    .single();

  if (!dentist) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin
    .from("schedules")
    .upsert(
      { ...parsed.data, is_active: true },
      { onConflict: "dentist_id,day_of_week" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const admin = createAdminClient();

  const { data: dentist } = await admin
    .from("dentists")
    .select("id")
    .eq("id", parsed.data.dentist_id)
    .eq("profile_id", user.id)
    .single();

  if (!dentist) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await admin
    .from("schedules")
    .delete()
    .eq("dentist_id", parsed.data.dentist_id)
    .eq("day_of_week", parsed.data.day_of_week);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
