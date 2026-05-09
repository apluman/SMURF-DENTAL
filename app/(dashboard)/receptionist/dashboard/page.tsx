import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { format } from "date-fns";

const statusClass: Record<string, string> = {
  confirmed: "badge-confirmed",
  pending: "badge-pending",
  cancelled: "badge-cancelled",
  completed: "badge-completed",
};

export default async function ReceptionistDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "receptionist") redirect(`/${profile?.role ?? "patient"}/dashboard`);

  const today = format(new Date(), "yyyy-MM-dd");

  const [
    { count: todayCount },
    { count: pendingCount },
    { count: totalCount },
    { data: recentAppts },
  ] = await Promise.all([
    admin.from("appointments").select("*", { count: "exact", head: true })
      .eq("scheduled_date", today)
      .in("status", ["pending", "confirmed"]),
    admin.from("appointments").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("appointments").select("*", { count: "exact", head: true }),
    admin.from("appointments")
      .select("*, patient:profiles!patient_id(full_name), service:services(name), dentist:dentists(profile:profiles(full_name))")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const stats = [
    { label: "Today's Appointments", value: todayCount ?? 0, color: "var(--accent)" },
    { label: "Pending Review", value: pendingCount ?? 0, color: "#EF4444" },
    { label: "Total All Time", value: totalCount ?? 0, color: "#C8963E" },
  ];

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h1
          className="font-display mb-1"
          style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "var(--ink)" }}
        >
          Reception Desk
        </h1>
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          </div>
        ))}
      </div>

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
                  style={{ borderBottom: i < (recentAppts.length - 1) ? "1px solid var(--border)" : "none" }}
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
