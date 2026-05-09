import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revokeToken } from "@/lib/google-calendar";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: dentist } = await admin
    .from("dentists")
    .select("google_refresh_token")
    .eq("profile_id", user.id)
    .single();

  // Revoke token at Google before clearing from DB
  if (dentist?.google_refresh_token) {
    try {
      await revokeToken(dentist.google_refresh_token);
    } catch {
      // Non-fatal — token may already be expired; clear DB record regardless
    }
  }

  const { error } = await admin
    .from("dentists")
    .update({ google_refresh_token: null, google_calendar_id: null })
    .eq("profile_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
