import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import AdminAppointmentsTable from "@/components/admin/AppointmentsTable";
import AddAppointmentModal from "@/components/receptionist/AddAppointmentModal";

const PAGE_SIZE = 20;
const VALID_FILTERS = ["all", "pending", "confirmed", "cancelled", "completed"];

export default async function ReceptionistAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "receptionist") redirect(`/${profile?.role ?? "patient"}/dashboard`);

  const { page: pageStr = "1", filter: rawFilter = "all" } = await searchParams;
  const filter = VALID_FILTERS.includes(rawFilter) ? rawFilter : "all";
  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let query = admin
    .from("appointments")
    .select(
      "*, patient:profiles!patient_id(*), dentist:dentists(*, profile:profiles(*)), service:services(*)",
      { count: "exact" }
    )
    .order("scheduled_date", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (filter !== "all") query = query.eq("status", filter);

  const [
    { data: appointments, count },
    { data: patients },
    { data: dentists },
    { data: services },
  ] = await Promise.all([
    query,
    admin.from("profiles").select("id, full_name, email").eq("role", "patient").order("full_name"),
    admin.from("dentists").select("id, profile:profiles(full_name)").order("created_at"),
    admin.from("services").select("id, name, price, duration_minutes").eq("is_active", true).order("name"),
  ]);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="font-display mb-1"
            style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "var(--ink)" }}
          >
            Appointments
          </h1>
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            {count ?? 0} total record{count !== 1 ? "s" : ""}
            {filter !== "all" ? ` · filtered by ${filter}` : ""}
          </p>
        </div>
        <AddAppointmentModal
          patients={(patients ?? []) as { id: string; full_name: string; email: string }[]}
          dentists={(dentists ?? []).map(d => ({ id: d.id, profile: Array.isArray(d.profile) ? d.profile[0] : d.profile })) as { id: string; profile: { full_name: string } }[]}
          services={(services ?? []) as { id: string; name: string; price: number; duration_minutes: number }[]}
        />
      </div>
      <AdminAppointmentsTable
        key={`${filter}-${safePage}`}
        appointments={appointments ?? []}
        page={safePage}
        totalPages={totalPages}
        total={count ?? 0}
        filter={filter}
        from=""
        to=""
      />
    </div>
  );
}
