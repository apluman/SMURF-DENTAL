import { createAdminClient } from "@/lib/supabase/admin";
import { format } from "date-fns";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  "auth.login":           { label: "Login",               color: "#6EE7B7" },
  "auth.logout":          { label: "Logout",              color: "#94A3B8" },
  "appointment.created":  { label: "Appointment Booked",  color: "#93C5FD" },
  "appointment.updated":  { label: "Appointment Updated", color: "#FCD34D" },
  "dentist.added":        { label: "Dentist Added",       color: "#A78BFA" },
  "dentist.removed":      { label: "Dentist Removed",     color: "#FCA5A5" },
  "receptionist.added":   { label: "Receptionist Added",  color: "#A78BFA" },
  "receptionist.removed": { label: "Receptionist Removed",color: "#FCA5A5" },
  "service.created":      { label: "Service Created",     color: "#6EE7B7" },
  "service.updated":      { label: "Service Updated",     color: "#FCD34D" },
  "settings.updated":     { label: "Settings Updated",    color: "#FCD34D" },
};

export default async function AuditLogPage() {
  const admin = createAdminClient();

  const { data: logs } = await admin
    .from("audit_log")
    .select("*, user:profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1
          className="font-display mb-1"
          style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "var(--ink)" }}
        >
          Audit Log
        </h1>
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
          Last {logs?.length ?? 0} actions · read-only
        </p>
      </div>

      {!logs?.length ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: "var(--surface)", border: "1px dashed var(--border)" }}>
          <p className="font-display text-lg mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--ink-muted)" }}>No logs yet</p>
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>Actions will appear here as they happen.</p>
        </div>
      ) : (
        <div className="card overflow-hidden" style={{ padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Time", "User", "Action", "Resource", "IP"].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: "var(--ink-muted)" };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const user = log.user as any;
                return (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: i < logs.length - 1 ? "1px solid var(--border)" : "none",
                      background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)",
                    }}
                  >
                    <td style={{ padding: "0.65rem 1rem", color: "var(--ink-muted)", whiteSpace: "nowrap" }}>
                      {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                    </td>
                    <td style={{ padding: "0.65rem 1rem" }}>
                      <p style={{ fontWeight: 500, color: "var(--ink)" }}>{user?.full_name ?? "—"}</p>
                      <p style={{ fontSize: "0.7rem", color: "var(--ink-muted)" }}>{user?.email ?? ""}</p>
                    </td>
                    <td style={{ padding: "0.65rem 1rem" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "999px",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        background: `${meta.color}18`,
                        color: meta.color,
                        border: `1px solid ${meta.color}30`,
                      }}>
                        {meta.label}
                      </span>
                    </td>
                    <td style={{ padding: "0.65rem 1rem", color: "var(--ink-muted)" }}>
                      {log.resource_type && log.resource_id
                        ? `${log.resource_type} · ${log.resource_id.slice(0, 8)}…`
                        : log.resource_type ?? "—"}
                    </td>
                    <td style={{ padding: "0.65rem 1rem", color: "var(--ink-muted)", fontFamily: "monospace", fontSize: "0.75rem" }}>
                      {log.ip_address ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
