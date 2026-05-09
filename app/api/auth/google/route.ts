import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUrl } from "@/lib/google-calendar";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: dentist } = await admin
    .from("dentists")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!dentist) return NextResponse.json({ error: "Dentist profile not found" }, { status: 404 });

  // Generate a one-time nonce and store it in an httpOnly cookie
  const nonce = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("oauth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300, // 5 minutes
    path: "/",
  });

  // Embed both dentistId and nonce in state so callback can verify both
  const state = `${dentist.id}|${nonce}`;
  const url = getAuthUrl(state);
  return NextResponse.redirect(url);
}
