import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  confirmed: { label: "Confirmed", cls: "badge-confirmed" },
  pending:   { label: "Pending",   cls: "badge-pending" },
  cancelled: { label: "Cancelled", cls: "badge-cancelled" },
  completed: { label: "Completed", cls: "badge-completed" },
};

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = Number(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function localDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00");
}

function isUpcoming(dateStr: string) {
  const apptDay = localDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return apptDay >= today;
}

export default async function PatientDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("full_name").eq("id", user.id).single();
  const { data: appointments } = await admin
    .from("appointments")
    .select("*, dentist:dentists(*, profile:profiles(*)), service:services(*)")
    .eq("patient_id", user.id)
    .order("scheduled_date", { ascending: true })
    .limit(8);

  const upcoming = appointments?.filter(a => isUpcoming(a.scheduled_date) && a.status !== "cancelled") ?? [];
  const next = upcoming[0];

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function dateLabel(dateStr: string) {
    const d = localDate(dateStr);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - todayDate.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return format(d, "MMM d, yyyy");
  }

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="font-display mb-1"
            style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "var(--ink)" }}
          >
            Hello, {firstName}
          </h1>
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Link
          href="/patient/book"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-90"
          style={{ background: "var(--accent)", color: "white" }}
        >
          + Book Appointment
        </Link>
      </div>

      {/* Next appointment hero card */}
      {next ? (
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: "var(--sidebar-bg)", color: "white" }}
        >
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full" style={{ border: "40px solid rgba(255,255,255,0.04)" }} />
          <div className="absolute -right-4 -bottom-16 w-64 h-64 rounded-full" style={{ border: "50px solid rgba(255,255,255,0.02)" }} />
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
            Next Appointment
          </p>
          <p className="font-display text-3xl font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>
            {(next.service as { name: string })?.name}
          </p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            Dr. {(next.dentist as { profile: { full_name: string } })?.profile?.full_name}
          </p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Date</p>
              <p className="font-semibold text-sm">{dateLabel(next.scheduled_date)}</p>
            </div>
            <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.1)" }} />
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Time</p>
              <p className="font-semibold text-sm">{formatTime(next.scheduled_time)}</p>
            </div>
            <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.1)" }} />
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Status</p>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_CONFIG[next.status]?.cls ?? "badge-completed"}`}>
                {next.status}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "var(--accent-subtle)", border: "1.5px dashed rgba(26,122,94,0.3)" }}
        >
          <p className="font-display text-xl mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}>
            No upcoming appointments
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--ink-muted)" }}>Ready to schedule your next visit?</p>
          <Link
            href="/patient/book"
            className="inline-flex px-5 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-90"
            style={{ background: "var(--accent)", color: "white" }}
          >
            Book Now
          </Link>
        </div>
      )}

      {/* Recent appointments */}
      {!!appointments?.length && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: "var(--ink)" }}>Recent Appointments</h2>
            <Link
              href="/patient/appointments"
              className="text-xs font-medium transition hover:opacity-70"
              style={{ color: "var(--accent)" }}
            >
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {appointments.map((appt) => {
              const status = STATUS_CONFIG[appt.status ?? "completed"] ?? STATUS_CONFIG.completed;
              const d = localDate(appt.scheduled_date);
              return (
                <div
                  key={appt.id}
                  className="card p-4 flex items-center justify-between transition-all hover:-translate-y-px"
                  style={{ boxShadow: "var(--shadow)" }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                      style={{ background: "var(--accent-subtle)" }}
                    >
                      <p className="text-xs font-bold leading-none" style={{ color: "var(--accent)" }}>
                        {format(d, "MMM").toUpperCase()}
                      </p>
                      <p className="text-lg font-bold leading-tight" style={{ color: "var(--accent)", fontFamily: "var(--font-display)" }}>
                        {format(d, "d")}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
                        {(appt.service as { name: string })?.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
                        Dr. {(appt.dentist as { profile: { full_name: string } })?.profile?.full_name} · {formatTime(appt.scheduled_time)}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${status?.cls ?? "badge-completed"}`}>
                    {status?.label ?? appt.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
