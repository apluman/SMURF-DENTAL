import { createAdminClient } from "@/lib/supabase/admin";
import BookingForm from "@/components/patient/BookingForm";

export default async function BookAppointmentPage() {
  const admin = createAdminClient();

  const [{ data: dentists }, { data: services }, { data: settings }] = await Promise.all([
    admin.from("dentists").select("*, profile:profiles(id, full_name)").order("created_at"),
    admin.from("services").select("*").eq("is_active", true).order("name"),
    admin.from("clinic_settings").select("booking_advance_days").single(),
  ]);

  return (
    <div className="space-y-6 animate-fade-up max-w-xl mx-auto">
      <div>
        <h1
          className="font-display mb-1"
          style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "var(--ink)" }}
        >
          Book an Appointment
        </h1>
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
          Follow the steps to schedule your visit
        </p>
      </div>

      <div className="card p-7">
        <BookingForm
          dentists={dentists ?? []}
          services={services ?? []}
          maxBookingDays={settings?.booking_advance_days ?? 30}
        />
      </div>
    </div>
  );
}
