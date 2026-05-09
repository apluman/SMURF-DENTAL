"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export async function deleteAccountAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  // Sign out first so session is cleared before the user row is deleted
  await supabase.auth.signOut();

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  redirect("/");
}
