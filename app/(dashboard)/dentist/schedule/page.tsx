import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import ScheduleManager from "@/components/dentist/ScheduleManager";
import GoogleCalendarConnect from "@/components/dentist/GoogleCalendarConnect";
import CalendarToast from "@/components/dentist/CalendarToast";
import AppointmentCalendar from "@/components/dentist/AppointmentCalendar";
import BlockedDatesList from "@/components/dentist/BlockedDatesList";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function DentistSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ cal?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: dentist } = await admin
    .from("dentists")
    .select("id, google_refresh_token, google_calendar_id")
    .eq("profile_id", user.id)
    .single();

  if (!dentist) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="font-display text-xl mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}>
            Profile not set up yet
          </p>
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>Please contact the admin.</p>
        </div>
      </div>
    );
  }

  const [{ data: schedules }, { data: blockedDates }, { data: appointments }] = await Promise.all([
    admin.from("schedules").select("*").eq("dentist_id", dentist.id).order("day_of_week"),
    admin
      .from("blocked_dates")
      .select("*")
      .eq("dentist_id", dentist.id)
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date"),
    admin
      .from("appointments")
      .select("*, patient:profiles!patient_id(full_name, phone), service:services(name, duration_minutes)")
      .eq("dentist_id", dentist.id)
      .in("status", ["pending", "confirmed", "completed"])
      .order("scheduled_date"),
  ]);

  const { cal } = await searchParams;

  // Shape data for the calendar component
  const calendarAppointments = (appointments ?? []).map((a) => ({
    id: a.id,
    scheduled_date: a.scheduled_date,
    scheduled_time: a.scheduled_time,
    status: a.status,
    notes: a.notes,
    patient: {
      full_name: (a.patient as { full_name: string; phone?: string | null })?.full_name ?? "Unknown",
      phone: (a.patient as { full_name: string; phone?: string | null })?.phone,
    },
    service: {
      name: (a.service as { name: string; duration_minutes: number })?.name ?? "Service",
      duration_minutes: (a.service as { name: string; duration_minutes: number })?.duration_minutes ?? 30,
    },
  }));

  const calendarBlocked = (blockedDates ?? []).map((b) => ({
    id: b.id,
    date: b.date,
    reason: b.reason,
  }));

  return (
    <div className="space-y-8 animate-fade-up max-w-4xl">
      <CalendarToast status={cal} />

      <div>
        <h1
          className="font-display mb-1"
          style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "var(--ink)" }}
        >
          My Schedule
        </h1>
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
          Manage your working hours, time off, and view upcoming appointments
        </p>
      </div>

      {/* Appointment calendar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>
            Appointment Calendar
          </h2>
          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="flex items-center gap-3">
              {[
                { label: "Confirmed", color: "#1A7A5E" },
                { label: "Pending",   color: "#C8963E" },
                { label: "Completed", color: "#6B7280" },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs" style={{ color: "var(--ink-muted)" }}>{label}</span>
                </div>
              ))}
            </div>
            {/* Google Calendar pill */}
            <GoogleCalendarConnect isConnected={!!dentist.google_refresh_token} />
          </div>
        </div>
        <AppointmentCalendar
          appointments={calendarAppointments}
          blockedDates={calendarBlocked}
        />
      </div>

      {/* Weekly hours table */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--ink-muted)" }}>
          Weekly Hours
        </h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
              <tr>
                {["Day", "Start", "End", "Status"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, i) => {
                const schedule = schedules?.find(s => s.day_of_week === i);
                const isWeekend = i === 0 || i === 6;
                return (
                  <tr
                    key={day}
                    className="tr-hover"
                    style={{
                      borderBottom: i < 6 ? "1px solid var(--border)" : "none",
                      opacity: isWeekend && !schedule ? 0.5 : 1,
                    }}
                  >
                    <td className="px-5 py-3.5 font-medium" style={{ color: "var(--ink)" }}>{day}</td>
                    <td className="px-5 py-3.5" style={{ color: "var(--ink-muted)" }}>
                      {schedule ? schedule.start_time.slice(0, 5) : "—"}
                    </td>
                    <td className="px-5 py-3.5" style={{ color: "var(--ink-muted)" }}>
                      {schedule ? schedule.end_time.slice(0, 5) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {schedule ? (
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${schedule.is_active ? "badge-confirmed" : "badge-completed"}`}>
                          {schedule.is_active ? "Active" : "Off"}
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold badge-completed">
                          Not set
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule manager */}
      <ScheduleManager dentistId={dentist.id} schedules={schedules ?? []} />

      {/* Blocked dates */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--ink-muted)" }}>
          Blocked Dates
        </h2>
        <BlockedDatesList
          blockedDates={(blockedDates ?? []).map(b => ({ id: b.id, date: b.date, reason: b.reason }))}
          dentistId={dentist.id}
        />
      </div>
    </div>
  );
}
