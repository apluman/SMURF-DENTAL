import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { format } from "date-fns";

export default async function ReceptionistPatientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "receptionist") redirect(`/${profile?.role ?? "patient"}/dashboard`);

  const { data: patients } = await admin
    .from("profiles")
    .select("id, full_name, email, phone, created_at")
    .eq("role", "patient")
    .order("full_name");

  function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1
          className="font-display mb-1"
          style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "var(--ink)" }}
        >
          Patients
        </h1>
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
          {patients?.length ?? 0} registered patient{(patients?.length ?? 0) !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
            <tr>
              {["Patient", "Email", "Phone", "Registered"].map(h => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-xs font-semibold tracking-wider uppercase"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {patients?.map((p, i) => (
              <tr
                key={p.id}
                className="tr-hover"
                style={{ borderBottom: i < (patients.length - 1) ? "1px solid var(--border)" : "none" }}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
                    >
                      {p.full_name ? getInitials(p.full_name) : "?"}
                    </div>
                    <span className="font-medium" style={{ color: "var(--ink)" }}>{p.full_name ?? "—"}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5" style={{ color: "var(--ink-muted)" }}>{p.email}</td>
                <td className="px-5 py-3.5" style={{ color: "var(--ink-muted)" }}>{p.phone ?? "—"}</td>
                <td className="px-5 py-3.5 text-xs" style={{ color: "var(--ink-muted)" }}>
                  {p.created_at ? format(new Date(p.created_at), "MMM d, yyyy") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!patients?.length && (
          <div className="py-14 text-center text-sm" style={{ color: "var(--ink-muted)" }}>
            No patients registered yet.
          </div>
        )}
      </div>
    </div>
  );
}
