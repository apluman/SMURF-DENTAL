import { createAdminClient } from "@/lib/supabase/admin";
import DentistsTable from "@/components/admin/DentistsTable";
import AddDentistModal from "@/components/admin/AddDentistModal";

export default async function AdminDentistsPage() {
  const admin = createAdminClient();

  const existingDentistProfileIds = await admin.from("dentists").select("profile_id");
  const takenIds = (existingDentistProfileIds.data ?? []).map((d) => d.profile_id);

  const [{ data: dentists }, { data: profiles }] = await Promise.all([
    admin.from("dentists").select("*, profile:profiles(*)").order("created_at"),
    admin
      .from("profiles")
      .select("id, full_name, email")
      .not("id", "in", takenIds.length > 0 ? `(${takenIds.join(",")})` : "(00000000-0000-0000-0000-000000000000)")
      .neq("role", "admin")
      .order("full_name"),
  ]);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="font-display mb-1"
            style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "var(--ink)" }}
          >
            Dentists
          </h1>
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            {dentists?.length ?? 0} registered
          </p>
        </div>
        <AddDentistModal profiles={profiles ?? []} />
      </div>
      <DentistsTable dentists={dentists ?? []} />
    </div>
  );
}
