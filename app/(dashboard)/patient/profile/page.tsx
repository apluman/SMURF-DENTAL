import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/patient/ProfileForm";

export default async function PatientProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-xl">
      <div>
        <h1
          className="font-display mb-1"
          style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "var(--ink)" }}
        >
          My Profile
        </h1>
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
          Manage your personal information
        </p>
      </div>

      {/* Avatar card */}
      <div className="card p-5 flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
          style={{ background: "var(--accent)", color: "white", fontFamily: "var(--font-display)" }}
        >
          {profile?.full_name ? getInitials(profile.full_name) : "?"}
        </div>
        <div>
          <p className="font-semibold" style={{ color: "var(--ink)" }}>{profile?.full_name}</p>
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>{profile?.email}</p>
          <span
            className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
            style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
          >
            {profile?.role}
          </span>
        </div>
      </div>

      {/* Form card */}
      <div className="card p-7">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
