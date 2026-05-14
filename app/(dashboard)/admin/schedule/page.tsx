import { createAdminClient } from "@/lib/supabase/admin";
import AdminScheduleManager from "@/components/admin/AdminScheduleManager";

export default async function AdminSchedulePage() {
  const admin = createAdminClient();

  const [{ data: dentists }, { data: blockedDates }] = await Promise.all([
    admin
      .from("dentists")
      .select("id, profile:profiles(id, full_name)")
      .order("created_at"),
    admin
      .from("blocked_dates")
      .select("id, date, reason")
      .is("dentist_id", null)
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date"),
  ]);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1
          className="font-display mb-1"
          style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "var(--ink)" }}
        >
          Schedule Management
        </h1>
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
          Set working hours per dentist and block clinic-wide closures.
        </p>
      </div>

      <AdminScheduleManager
        dentists={(dentists ?? []).map(d => ({ id: d.id, profile: Array.isArray(d.profile) ? d.profile[0] : d.profile })) as { id: string; profile: { id: string; full_name: string } }[]}
        initialBlockedDates={blockedDates ?? []}
      />
    </div>
  );
}
