import { createAdminClient } from "@/lib/supabase/admin";
import ClinicSettingsForm from "@/components/admin/ClinicSettingsForm";

export default async function AdminSettingsPage() {
  const admin = createAdminClient();
  const { data: settings } = await admin.from("clinic_settings").select("*").single();

  return (
    <div className="space-y-6 animate-fade-up max-w-2xl">
      <div>
        <h1
          className="font-display mb-1"
          style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "var(--ink)" }}
        >
          Clinic Settings
        </h1>
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
          Manage your clinic information and booking configuration
        </p>
      </div>
      <div className="card p-7">
        <ClinicSettingsForm settings={settings} />
      </div>
    </div>
  );
}
