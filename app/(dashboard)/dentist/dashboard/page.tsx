import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { format } from "date-fns";

const STATUS_CONFIG: Record<string, { cls: string }> = {
  confirmed: { cls: "badge-confirmed" },
  pending:   { cls: "badge-pending" },
};

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = Number(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

export default async function DentistDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: dentist } = await admin
    .from("dentists")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!dentist) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-display mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}>
            Profile not set up yet
          </p>
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>Please contact the admin to complete your profile.</p>
        </div>
      </div>
    );
  }

  const today = format(new Date(), "yyyy-MM-dd");

  const [{ data: todayAppts }, { data: upcomingAppts }, { count: totalCount }] = await Promise.all([
    admin
      .from("appointments")
      .select("*, patient:profiles!patient_id(full_name, phone), service:services(name, duration_minutes)")
      .eq("dentist_id", dentist.id)
      .eq("scheduled_date", today)
      .in("status", ["pending", "confirmed"])
      .order("scheduled_time"),
    admin
      .from("appointments")
      .select("*, patient:profiles!patient_id(full_name), service:services(name)")
      .eq("dentist_id", dentist.id)
      .gt("scheduled_date", today)
      .in("status", ["pending", "confirmed"])
      .order("scheduled_date")
      .limit(5),
    admin
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("dentist_id", dentist.id)
      .eq("status", "completed"),
  ]);

  const stats = [
    { label: "Today's Patients", value: todayAppts?.length ?? 0, color: "var(--accent)" },
    { label: "Upcoming",         value: upcomingAppts?.length ?? 0, color: "#C8963E" },
    { label: "Completed All-Time", value: totalCount ?? 0, color: "#8B5CF6" },
  ];

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div>
        <h1
          className="font-display mb-1"
          style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "var(--ink)" }}
        >
          My Dashboard
        </h1>
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="stat-card p-5 animate-fade-up"
            style={{ borderLeftColor: s.color, animationDelay: `${i * 80}ms` }}
          >
            <p className="text-xs font-medium mb-3" style={{ color: "var(--ink-muted)" }}>{s.label}</p>
            <p
              className="font-display"
              style={{ fontFamily: "var(--font-display)", fontSize: "2.6rem", fontWeight: 600, color: s.color, lineHeight: 1 }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Today's Schedule */}
      <div>
        <h2 className="text-base font-semibold mb-4" style={{ color: "var(--ink)" }}>
          Today&apos;s Schedule
        </h2>

        {!todayAppts?.length ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="font-display text-xl mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--ink-muted)" }}>
              No appointments today
            </p>
            <p className="text-sm" style={{ color: "var(--ink-muted)" }}>Enjoy your free day!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayAppts.map((appt) => {
              const patient = appt.patient as { full_name: string; phone?: string };
              const service = appt.service as { name: string; duration_minutes: number };
              const statusCls = STATUS_CONFIG[appt.status]?.cls ?? "badge-completed";

              return (
                <div
                  key={appt.id}
                  className="card flex items-center gap-5 p-4 transition-all hover:-translate-y-px"
                >
                  {/* Time block */}
                  <div
                    className="flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center"
                    style={{ background: "var(--accent-subtle)" }}
                  >
                    <p className="text-base font-bold" style={{ color: "var(--accent)", fontFamily: "var(--font-display)" }}>
                      {formatTime(appt.scheduled_time).split(" ")[0]}
                    </p>
                    <p className="text-[10px] font-semibold" style={{ color: "var(--accent)" }}>
                      {formatTime(appt.scheduled_time).split(" ")[1]}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{patient?.full_name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
                      {service?.name} · {service?.duration_minutes} min
                    </p>
                    {patient?.phone && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>{patient.phone}</p>
                    )}
                  </div>

                  <span className={`flex-shrink-0 inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${statusCls}`}>
                    {appt.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming */}
      {!!upcomingAppts?.length && (
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--ink)" }}>
            Upcoming Appointments
          </h2>
          <div className="card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
                <tr>
                  {["Patient", "Service", "Date", "Time", "Status"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {upcomingAppts.map((appt, i) => {
                  const patient = appt.patient as { full_name: string };
                  const service = appt.service as { name: string };
                  const statusCls = STATUS_CONFIG[appt.status]?.cls ?? "badge-completed";
                  return (
                    <tr
                      key={appt.id}
                      className="tr-hover"
                      style={{ borderBottom: i < upcomingAppts.length - 1 ? "1px solid var(--border)" : "none" }}
                    >
                      <td className="px-5 py-3.5 font-medium" style={{ color: "var(--ink)" }}>{patient?.full_name}</td>
                      <td className="px-5 py-3.5" style={{ color: "var(--ink-muted)" }}>{service?.name}</td>
                      <td className="px-5 py-3.5" style={{ color: "var(--ink-muted)" }}>{appt.scheduled_date}</td>
                      <td className="px-5 py-3.5" style={{ color: "var(--ink-muted)" }}>{formatTime(appt.scheduled_time)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${statusCls}`}>
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
