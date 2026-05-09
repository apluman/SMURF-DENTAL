import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = Number(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) redirect("/patient/book");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: appt } = await admin
    .from("appointments")
    .select("*, dentist:dentists(profile:profiles(full_name), specialization), service:services(name, price, duration_minutes)")
    .eq("id", id)
    .eq("patient_id", user.id)
    .single();

  if (!appt) redirect("/patient/appointments");

  const dentist = appt.dentist as { profile: { full_name: string } | null; specialization: string } | null;
  const service = appt.service as { name: string; price: number; duration_minutes: number } | null;

  const rows = [
    { label: "Dentist", value: `Dr. ${dentist?.profile?.full_name ?? "—"}` },
    { label: "Specialization", value: dentist?.specialization ?? "—" },
    { label: "Service", value: service?.name ?? "—" },
    { label: "Price", value: `₱${Number(service?.price ?? 0).toLocaleString()}` },
    { label: "Duration", value: `${service?.duration_minutes ?? "—"} min` },
    { label: "Date", value: format(new Date(appt.scheduled_date + "T00:00:00"), "EEEE, MMMM d, yyyy") },
    { label: "Time", value: formatTime(appt.scheduled_time) },
    { label: "Status", value: "Pending confirmation" },
  ];

  return (
    <div className="animate-fade-up max-w-lg mx-auto" style={{ paddingTop: "2rem" }}>
      {/* Success icon */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem", textAlign: "center" }}>
        <div style={{ width: "4rem", height: "4rem", borderRadius: "50%", background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1
          className="font-display"
          style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.5rem" }}
        >
          Appointment Booked!
        </h1>
        <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem", maxWidth: "22rem", lineHeight: 1.6 }}>
          Your appointment has been submitted. You'll receive a confirmation email once the clinic confirms it.
        </p>
      </div>

      {/* Summary card */}
      <div className="card overflow-hidden" style={{ marginBottom: "1.5rem" }}>
        <div style={{ padding: "0.75rem 1.25rem", background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-muted)" }}>
            Appointment Details
          </p>
        </div>
        {rows.map((row, i) => (
          <div
            key={row.label}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "0.75rem 1.25rem",
              borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
              gap: "1rem",
            }}
          >
            <span style={{ fontSize: "0.8rem", color: "var(--ink-muted)", flexShrink: 0 }}>{row.label}</span>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: row.label === "Status" ? "#C8963E" : "var(--ink)", textAlign: "right" }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Email notice */}
      <div style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", padding: "0.875rem 1rem", borderRadius: "0.75rem", background: "var(--accent-subtle)", border: "1px solid rgba(26,122,94,0.2)", marginBottom: "1.5rem" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "0.1rem" }}>
          <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        <p style={{ fontSize: "0.8rem", color: "var(--accent)", lineHeight: 1.5 }}>
          A confirmation email has been sent to your inbox. Check your spam folder if you don't see it.
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        <Link
          href="/patient/appointments"
          style={{ display: "block", textAlign: "center", padding: "0.75rem 1.5rem", borderRadius: "0.875rem", background: "var(--accent)", color: "white", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}
        >
          View My Appointments
        </Link>
        <Link
          href="/patient/book"
          style={{ display: "block", textAlign: "center", padding: "0.75rem 1.5rem", borderRadius: "0.875rem", border: "1px solid var(--border)", color: "var(--ink-muted)", fontWeight: 500, fontSize: "0.875rem", textDecoration: "none" }}
        >
          Book Another Appointment
        </Link>
      </div>
    </div>
  );
}
