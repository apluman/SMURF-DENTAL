"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Profile } from "@/types";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.75rem",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--ink)",
  fontSize: "0.875rem",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.72rem",
  fontWeight: 600,
  color: "var(--ink-muted)",
  marginBottom: "0.375rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

export default function AddReceptionistModal({ profiles }: { profiles: Profile[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [profileId, setProfileId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function handleClose() {
    setOpen(false);
    setProfileId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/receptionists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: profileId }),
    });
    if (!res.ok) {
      const data = await res.json() as { error: string };
      toast.error(typeof data.error === "string" ? data.error : "Failed to add receptionist.");
      setSaving(false);
      return;
    }
    toast.success("Receptionist added successfully.");
    handleClose();
    router.refresh();
    setSaving(false);
  }

  const overlayStyle: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 9999,
    background: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "1rem",
  };

  const boxStyle: React.CSSProperties = {
    background: "var(--surface)",
    boxShadow: "var(--shadow-md)",
    borderRadius: "1rem",
    padding: "1.5rem",
    width: "100%",
    maxWidth: "28rem",
    maxHeight: "85vh",
    overflowY: "auto",
  };

  const modal = open && (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={boxStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 600, color: "var(--ink)" }}>Add Receptionist</h2>
          <button onClick={handleClose} style={{ fontSize: "1.25rem", lineHeight: 1, color: "var(--ink-muted)", background: "none", border: "none", cursor: "pointer" }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Select Profile</label>
            <select value={profileId} onChange={e => setProfileId(e.target.value)} required style={inputStyle}>
              <option value="">Choose a user account…</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name} — {p.email}</option>
              ))}
            </select>
            {profiles.length === 0 && (
              <p style={{ fontSize: "0.75rem", marginTop: "0.25rem", color: "#C8963E" }}>No available profiles. Register a user first.</p>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.25rem" }}>
            <button type="button" onClick={handleClose} style={{ flex: 1, padding: "0.625rem", borderRadius: "0.75rem", fontSize: "0.875rem", fontWeight: 500, background: "var(--bg)", color: "var(--ink)", border: "1px solid var(--border)", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving || !profileId} style={{ flex: 1, padding: "0.625rem", borderRadius: "0.75rem", fontSize: "0.875rem", fontWeight: 500, background: "var(--accent)", color: "white", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving || !profileId ? 0.5 : 1 }}>
              {saving ? "Adding…" : "Add Receptionist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-90"
        style={{ background: "var(--accent)", color: "white" }}
      >
        + Add Receptionist
      </button>
      {mounted && createPortal(modal, document.body)}
    </>
  );
}
