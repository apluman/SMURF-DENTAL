"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import type { Profile } from "@/types";

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    patient:      { bg: "rgba(14,165,233,0.12)",  color: "#0EA5E9" },
    dentist:      { bg: "rgba(16,185,129,0.12)",  color: "#10B981" },
    receptionist: { bg: "rgba(139,92,246,0.12)",  color: "#8B5CF6" },
  };
  const c = colors[role] ?? { bg: "rgba(107,114,128,0.12)", color: "#6B7280" };
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: "2px 10px", borderRadius: "999px",
      fontSize: "0.75rem", fontWeight: 600, textTransform: "capitalize",
    }}>
      {role}
    </span>
  );
}

function ConfirmDeleteModal({
  user,
  onConfirm,
  onCancel,
  pending,
}: {
  user: Profile;
  onConfirm: () => void;
  onCancel: () => void;
  pending: boolean;
}) {
  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "1rem", padding: "1.75rem", width: "100%", maxWidth: "420px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "50%",
          background: "rgba(220,38,38,0.1)", display: "flex",
          alignItems: "center", justifyContent: "center", marginBottom: "1rem",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </div>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.5rem" }}>
          Delete account?
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
          This will permanently delete <strong style={{ color: "var(--ink)" }}>{user.full_name}</strong> ({user.email}).
          Their appointment history will be preserved. This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={onCancel}
            disabled={pending}
            style={{
              flex: 1, padding: "0.625rem", borderRadius: "0.625rem",
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--ink)", fontSize: "0.875rem", fontWeight: 500,
              cursor: pending ? "not-allowed" : "pointer", opacity: pending ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            style={{
              flex: 1, padding: "0.625rem", borderRadius: "0.625rem",
              border: "none", background: "#DC2626",
              color: "white", fontSize: "0.875rem", fontWeight: 600,
              cursor: pending ? "not-allowed" : "pointer", opacity: pending ? 0.7 : 1,
            }}
          >
            {pending ? "Deleting…" : "Delete account"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AccountsTable({ users }: { users: Profile[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "patient" | "dentist" | "receptionist">("all");
  const [toDelete, setToDelete] = useState<Profile | null>(null);
  const [list, setList] = useState(users);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = list.filter((u) => {
    const matchSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  function handleDelete() {
    if (!toDelete) return;
    const id = toDelete.id;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Failed to delete account");
        setToDelete(null);
        return;
      }
      setList((prev) => prev.filter((u) => u.id !== id));
      setToDelete(null);
    });
  }

  return (
    <>
      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: "200px", padding: "0.5rem 0.875rem",
            borderRadius: "0.625rem", border: "1px solid var(--border)",
            background: "var(--bg)", color: "var(--ink)", fontSize: "0.875rem",
          }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          style={{
            padding: "0.5rem 0.875rem", borderRadius: "0.625rem",
            border: "1px solid var(--border)", background: "var(--bg)",
            color: "var(--ink)", fontSize: "0.875rem",
          }}
        >
          <option value="all">All roles</option>
          <option value="patient">Patient</option>
          <option value="dentist">Dentist</option>
          <option value="receptionist">Receptionist</option>
        </select>
      </div>

      {error && (
        <p style={{ color: "#DC2626", fontSize: "0.875rem", marginBottom: "0.75rem" }}>{error}</p>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Name", "Email", "Role", "Joined", ""].map((h) => (
                <th key={h} style={{
                  padding: "0.625rem 0.875rem", textAlign: "left",
                  fontSize: "0.75rem", fontWeight: 600, color: "var(--ink-muted)",
                  textTransform: "uppercase", letterSpacing: "0.04em",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--ink-muted)" }}>
                  No accounts found
                </td>
              </tr>
            ) : filtered.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.75rem 0.875rem", color: "var(--ink)", fontWeight: 500 }}>
                  {u.full_name ?? "—"}
                </td>
                <td style={{ padding: "0.75rem 0.875rem", color: "var(--ink-muted)" }}>
                  {u.email ?? "—"}
                </td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <RoleBadge role={u.role ?? "patient"} />
                </td>
                <td style={{ padding: "0.75rem 0.875rem", color: "var(--ink-muted)" }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                </td>
                <td style={{ padding: "0.75rem 0.875rem", textAlign: "right" }}>
                  <button
                    onClick={() => setToDelete(u)}
                    style={{
                      padding: "0.375rem 0.75rem", borderRadius: "0.5rem",
                      border: "1px solid rgba(220,38,38,0.3)", background: "rgba(220,38,38,0.06)",
                      color: "#DC2626", fontSize: "0.8125rem", fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "0.75rem" }}>
        {filtered.length} account{filtered.length !== 1 ? "s" : ""}
        {roleFilter !== "all" ? ` · ${roleFilter}` : ""}
        {search ? ` · matching "${search}"` : ""}
      </p>

      {toDelete && (
        <ConfirmDeleteModal
          user={toDelete}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
          pending={pending}
        />
      )}
    </>
  );
}
