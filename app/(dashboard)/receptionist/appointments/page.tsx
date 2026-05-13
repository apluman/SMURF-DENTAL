import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import AdminAppointmentsTable from "@/components/admin/AppointmentsTable";

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

  if (filter !== "all") {
    query = query.eq("status", filter);
  }

  const { data: appointments, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return (
    <div className="space-y-6 animate-fade-up">
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
