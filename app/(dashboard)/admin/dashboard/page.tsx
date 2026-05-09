import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { format } from "date-fns";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [
    { count: totalAppointments },
    { count: totalPatients },
    { count: pendingAppointments },
    { count: confirmedToday },
  ] = await Promise.all([
    admin.from("appointments").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "patient"),
    admin.from("appointments").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("appointments").select("*", { count: "exact", head: true })
      .eq("status", "confirmed")
      .eq("scheduled_date", format(new Date(), "yyyy-MM-dd")),
  ]);

  const stats = [
    {
      label: "Total Appointments",
      value: totalAppointments ?? 0,
      sub: "All time",
      color: "var(--accent)",
    },
    {
      label: "Registered Patients",
      value: totalPatients ?? 0,
      sub: "All time",
      color: "#C8963E",
    },
    {
      label: "Pending Review",
      value: pendingAppointments ?? 0,
      sub: "Needs attention",
      color: "#EF4444",
    },
    {
      label: "Confirmed Today",
      value: confirmedToday ?? 0,
      sub: format(new Date(), "MMM d, yyyy"),
      color: "#8B5CF6",
    },
  ];

  const { data: recentAppts } = await admin
    .from("appointments")
    .select("*, patient:profiles!patient_id(full_name), service:services(name), dentist:dentists(profile:profiles(full_name))")
    .order("created_at", { ascending: false })
    .limit(6);

  const statusClass: Record<string, string> = {
    confirmed: "badge-confirmed",
    pending: "badge-pending",
    cancelled: "badge-cancelled",
    completed: "badge-completed",
  };

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div>
        <h1
          className="font-display mb-1"
          style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "var(--ink)" }}
        >
          Admin Dashboard
        </h1>
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="stat-card p-5 animate-fade-up"
            style={{ borderLeftColor: s.color, animationDelay: `${i * 80}ms` }}
          >
            <p className="text-xs font-medium mb-3" style={{ color: "var(--ink-muted)" }}>{s.label}</p>
            <p
              className="font-display mb-1"
              style={{ fontFamily: "var(--font-display)", fontSize: "2.6rem", fontWeight: 600, color: s.color, lineHeight: 1 }}
            >
              {s.value}
            </p>
            <p className="text-xs" style={{ color: "var(--ink-muted)" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent appointments */}
      <div>
        <h2 className="text-base font-semibold mb-4" style={{ color: "var(--ink)" }}>Recent Appointments</h2>
        <div className="card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
              <tr>
                {["Patient", "Service", "Dentist", "Date", "Status"].map(h => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-semibold tracking-wider uppercase"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentAppts?.map((appt, i) => (
                <tr
                  key={appt.id}
                  className="tr-hover"
                  style={{
                    borderBottom: i < (recentAppts.length - 1) ? "1px solid var(--border)" : "none",
                  }}
                >
                  <td className="px-5 py-3.5 font-medium" style={{ color: "var(--ink)" }}>
                    {(appt.patient as { full_name: string })?.full_name}
                  </td>
                  <td className="px-5 py-3.5" style={{ color: "var(--ink-muted)" }}>
                    {(appt.service as { name: string })?.name}
                  </td>
                  <td className="px-5 py-3.5" style={{ color: "var(--ink-muted)" }}>
                    Dr. {((appt.dentist as { profile: { full_name: string } })?.profile?.full_name ?? "—")}
                  </td>
                  <td className="px-5 py-3.5" style={{ color: "var(--ink-muted)" }}>
                    {appt.scheduled_date}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${statusClass[appt.status] ?? "badge-completed"}`}>
                      {appt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!recentAppts?.length && (
            <div className="py-14 text-center text-sm" style={{ color: "var(--ink-muted)" }}>
              No appointments yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
