import { createAdminClient } from "@/lib/supabase/admin";
import ReceptionistsTable from "@/components/admin/ReceptionistsTable";
import AddReceptionistModal from "@/components/admin/AddReceptionistModal";

export default async function AdminReceptionistsPage() {
  const admin = createAdminClient();

  const [{ data: receptionists }, { data: profiles }] = await Promise.all([
    admin
      .from("profiles")
      .select("*")
      .eq("role", "receptionist")
      .order("full_name"),
    admin
      .from("profiles")
      .select("id, full_name, email, phone, role, avatar_url, created_at, updated_at")
      .eq("role", "patient")
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
            Receptionists
          </h1>
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            {receptionists?.length ?? 0} registered
          </p>
        </div>
        <AddReceptionistModal profiles={profiles ?? []} />
      </div>
      <ReceptionistsTable receptionists={receptionists ?? []} />
    </div>
  );
}
