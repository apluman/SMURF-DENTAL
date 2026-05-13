"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/ratelimit";
import { redirect } from "next/navigation";

export async function loginAction(email: string, password: string) {
  const { allowed } = await checkRateLimit(`login:${email.toLowerCase()}`);
  if (!allowed) {
    return { error: "Too many login attempts. Please try again in 15 minutes." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication failed." };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "patient";
  redirect(`/${role}/dashboard`);
}
