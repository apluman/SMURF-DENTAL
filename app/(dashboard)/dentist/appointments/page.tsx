import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import DentistAppointmentsTable from "@/components/dentist/DentistAppointmentsTable";

export default async function DentistAppointmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: dentist } = await admin
    .from("dentists")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  const { data: appointments } = await admin
    .from("appointments")
    .select("*, patient:profiles!patient_id(full_name, email, phone), service:services(name, duration_minutes)")
    .eq("dentist_id", dentist?.id ?? "")
    .order("scheduled_date", { ascending: false });

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1
          className="font-display mb-1"
          style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "var(--ink)" }}
        >
          My Appointments
        </h1>
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
          {appointments?.length ?? 0} total
        </p>
      </div>
      <DentistAppointmentsTable appointments={appointments ?? []} />
    </div>
  );
}
