import { createAdminClient } from "@/lib/supabase/admin";
import ServicesTable from "@/components/admin/ServicesTable";
import AddServiceModal from "@/components/admin/AddServiceModal";

export default async function AdminServicesPage() {
  const admin = createAdminClient();
  const { data: services } = await admin.from("services").select("*").order("name");

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="font-display mb-1"
            style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "var(--ink)" }}
          >
            Services
          </h1>
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            {services?.length ?? 0} services · {services?.filter(s => s.is_active).length ?? 0} active
          </p>
        </div>
        <AddServiceModal />
      </div>
      <ServicesTable services={services ?? []} />
    </div>
  );
}
