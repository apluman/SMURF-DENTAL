import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeCode } from "@/lib/google-calendar";
import { encrypt } from "@/lib/encryption";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (error || !code || !state) {
    return NextResponse.redirect(`${baseUrl}/dentist/schedule?cal=error`);
  }

  // Verify CSRF — state must be dentistId|nonce and nonce must match cookie
  const [dentistId, nonce] = state.split("|");
  const cookieStore = await cookies();
  const storedNonce = cookieStore.get("oauth_nonce")?.value;

  if (!dentistId || !nonce || !storedNonce || nonce !== storedNonce) {
    return NextResponse.redirect(`${baseUrl}/dentist/schedule?cal=error`);
  }

  // Clear the nonce immediately — one-time use only
  cookieStore.delete("oauth_nonce");

  // Verify the authenticated user actually owns this dentist record
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  const admin = createAdminClient();
  const { data: dentist } = await admin
    .from("dentists")
    .select("profile_id")
    .eq("id", dentistId)
    .single();

  if (!dentist || dentist.profile_id !== user.id) {
    return NextResponse.redirect(`${baseUrl}/dentist/schedule?cal=error`);
  }

  try {
    const { refreshToken, calendarId } = await exchangeCode(code);

    await admin
      .from("dentists")
      .update({ google_refresh_token: encrypt(refreshToken), google_calendar_id: calendarId })
      .eq("id", dentistId);

    return NextResponse.redirect(`${baseUrl}/dentist/schedule?cal=connected`);
  } catch {
    return NextResponse.redirect(`${baseUrl}/dentist/schedule?cal=error`);
  }
}
