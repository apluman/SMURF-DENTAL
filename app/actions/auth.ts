"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/ratelimit";
import { auditLog } from "@/lib/audit";
import { redirect } from "next/navigation";

export async function forgotPasswordAction(email: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://smurf-dental.vercel.app";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: error.message };
  return {};
}

export async function resetPasswordAction(password: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return {};
}

export async function logoutAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await auditLog({ userId: user.id, action: "auth.logout" });
  await supabase.auth.signOut();
  redirect("/login");
}

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
  await auditLog({ userId: user.id, action: "auth.login", metadata: { role } });
  redirect(`/${role}/dashboard`);
}
