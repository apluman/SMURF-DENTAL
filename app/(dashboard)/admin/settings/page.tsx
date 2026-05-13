import { createAdminClient } from "@/lib/supabase/admin";
import ClinicSettingsForm from "@/components/admin/ClinicSettingsForm";
import AccountsTable from "@/components/admin/AccountsTable";

export default async function AdminSettingsPage() {
  const admin = createAdminClient();

  const [{ data: settings }, { data: users }] = await Promise.all([
    admin.from("clinic_settings").select("*").single(),
    admin
      .from("profiles")
      .select("id, full_name, email, phone, role, avatar_url, created_at, updated_at")
      .in("role", ["patient", "dentist", "receptionist"])
      .order("full_name"),
  ]);

  return (
    <div className="space-y-10 animate-fade-up max-w-3xl">

      {/* Clinic Settings */}
      <div>
        <div style={{ marginBottom: "1.25rem" }}>
          <h1
            className="font-display mb-1"
            style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "var(--ink)" }}
          >
            Settings
          </h1>
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            Manage clinic information and user accounts
          </p>
        </div>
        <div className="card p-7">
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--ink)", marginBottom: "1.25rem" }}>
            Clinic Information
          </h2>
          <ClinicSettingsForm settings={settings} />
        </div>
      </div>

      {/* Account Management */}
      <div>
        <div className="card p-7">
          <div style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.25rem" }}>
              Account Management
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)" }}>
              Permanently delete patient, dentist, or receptionist accounts. Admin accounts cannot be removed here.
            </p>
          </div>
          <AccountsTable users={users ?? []} />
        </div>
      </div>

    </div>
  );
}
