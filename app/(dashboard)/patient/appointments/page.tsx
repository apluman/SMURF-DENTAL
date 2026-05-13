import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import CancelAppointmentButton from "@/components/patient/CancelAppointmentButton";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  confirmed: { label: "Confirmed", cls: "badge-confirmed" },
  pending:   { label: "Pending",   cls: "badge-pending" },
  cancelled: { label: "Cancelled", cls: "badge-cancelled" },
  completed: { label: "Completed", cls: "badge-completed" },
};

const PAGE_SIZE = 15;

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = Number(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function localDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00");
}

function dateLabel(dateStr: string) {
  const d = localDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return format(d, "MMM d, yyyy");
}

export default async function PatientAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { page: pageStr = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const admin = createAdminClient();
  const { data: appointments, count } = await admin
    .from("appointments")
    .select("*, dentist:dentists(*, profile:profiles(*)), service:services(*)", { count: "exact" })
    .eq("patient_id", user.id)
    .order("scheduled_date", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="font-display mb-1"
            style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "var(--ink)" }}
          >
            My Appointments
          </h1>
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            {count ?? 0} total
          </p>
        </div>
        <Link
          href="/patient/book"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-90"
          style={{ background: "var(--accent)", color: "white" }}
        >
          + Book New
        </Link>
      </div>

      {!appointments?.length ? (
        <div
          className="rounded-2xl p-14 text-center"
          style={{ background: "var(--accent-subtle)", border: "1.5px dashed rgba(26,122,94,0.3)" }}
        >
          <p className="font-display text-xl mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}>
            No appointments yet
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--ink-muted)" }}>
            Ready to schedule your first visit?
          </p>
          <Link
            href="/patient/book"
            className="inline-flex px-5 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-90"
            style={{ background: "var(--accent)", color: "white" }}
          >
            Book Now
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {appointments.map((appt) => {
              const status = STATUS_CONFIG[appt.status ?? "completed"] ?? STATUS_CONFIG.completed;
              const dentist = appt.dentist as { profile: { full_name: string } };
              const service = appt.service as { name: string };
              const d = localDate(appt.scheduled_date);
              const label = dateLabel(appt.scheduled_date);
              const isToday = label === "Today";

              return (
                <div
                  key={appt.id}
                  className="card p-5 flex items-center justify-between gap-4"
                  style={{ borderLeft: isToday ? "3px solid var(--accent)" : undefined }}
                >
                  <div className="flex items-center gap-4">
                    {/* Date block */}
                    <div
                      className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center"
                      style={{ background: isToday ? "var(--accent)" : "var(--accent-subtle)" }}
                    >
                      <p className="text-[10px] font-bold uppercase leading-none" style={{ color: isToday ? "rgba(255,255,255,0.7)" : "var(--accent)" }}>
                        {format(d, "MMM")}
                      </p>
                      <p
                        className="font-display text-2xl font-semibold leading-tight"
                        style={{ fontFamily: "var(--font-display)", color: isToday ? "white" : "var(--accent)" }}
                      >
                        {format(d, "d")}
                      </p>
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
                          {service?.name}
                        </p>
                        {isToday && (
                          <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--accent)", background: "var(--accent-subtle)", padding: "0.125rem 0.5rem", borderRadius: "999px" }}>
                            Today
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
                        Dr. {dentist?.profile?.full_name}
                      </p>
                      <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--accent)" }}>
                        {formatTime(appt.scheduled_time)} · {label !== "Today" ? label : format(d, "MMM d, yyyy")}
                      </p>
                      {appt.notes && (
                        <p className="text-xs mt-1 italic" style={{ color: "var(--ink-muted)" }}>
                          &ldquo;{appt.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${status?.cls ?? "badge-completed"}`}>
                      {status?.label ?? appt.status}
                    </span>
                    {["pending", "confirmed"].includes(appt.status) && (() => {
                      const apptDateTime = new Date(`${appt.scheduled_date}T${appt.scheduled_time}`);
                      const hoursUntil = (apptDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
                      return hoursUntil >= 24 ? <CancelAppointmentButton appointmentId={appt.id} /> : null;
                    })()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                Page {safePage} of {totalPages}
              </p>
              <div className="flex gap-2">
                {safePage > 1 ? (
                  <Link
                    href={`?page=${safePage - 1}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ border: "1px solid var(--border)", color: "var(--ink-muted)" }}
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ border: "1px solid var(--border)", color: "var(--ink-muted)", opacity: 0.4 }}>
                    Previous
                  </span>
                )}
                {safePage < totalPages ? (
                  <Link
                    href={`?page=${safePage + 1}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: "var(--accent)", color: "white", border: "1px solid var(--accent)" }}
                  >
                    Next
                  </Link>
                ) : (
                  <span className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--accent)", color: "white", border: "1px solid var(--accent)", opacity: 0.4 }}>
                    Next
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
