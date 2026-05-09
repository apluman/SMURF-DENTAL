"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Dentist, Profile } from "@/types";

type FullDentist = Dentist & { profile: Profile | null };

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--ink)",
  fontSize: "0.875rem",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--ink-muted)",
  marginBottom: "0.375rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

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

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

function EditModal({ dentist, onClose }: { dentist: FullDentist; onClose: () => void }) {
  const router = useRouter();
  const [specialization, setSpecialization] = useState(dentist.specialization);
  const [bio, setBio] = useState(dentist.bio ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/admin/dentists/${dentist.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specialization, bio: bio || undefined }),
    });
    if (res.ok) {
      toast.success("Dentist updated.");
      router.refresh();
      onClose();
    } else {
      const d = await res.json() as { error: string };
      toast.error(typeof d.error === "string" ? d.error : "Failed to update.");
    }
    setSaving(false);
  }

  return createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <div style={boxStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 600, color: "var(--ink)" }}>Edit Dentist</h2>
          <button onClick={onClose} style={{ fontSize: "1.25rem", lineHeight: 1, color: "var(--ink-muted)", background: "none", border: "none", cursor: "pointer" }}>×</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", padding: "0.75rem", borderRadius: "0.75rem", background: "var(--bg)" }}>
          <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 700, flexShrink: 0, background: "var(--accent)", color: "white" }}>
            {dentist.profile?.full_name ? getInitials(dentist.profile.full_name) : "?"}
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--ink)" }}>Dr. {dentist.profile?.full_name}</p>
            <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>{dentist.profile?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Specialization</label>
            <input style={inputStyle} value={specialization} onChange={e => setSpecialization(e.target.value)} required placeholder="e.g. General Dentistry" />
          </div>
          <div>
            <label style={labelStyle}>Bio <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Short bio or credentials…" />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.25rem" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "0.625rem", borderRadius: "0.75rem", fontSize: "0.875rem", fontWeight: 500, background: "var(--bg)", color: "var(--ink)", border: "1px solid var(--border)", cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "0.625rem", borderRadius: "0.75rem", fontSize: "0.875rem", fontWeight: 500, background: "var(--accent)", color: "white", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function DeleteModal({ dentist, onClose }: { dentist: FullDentist; onClose: () => void }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/admin/dentists/${dentist.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Dentist removed.");
      router.refresh();
      onClose();
    } else {
      toast.error("Failed to remove dentist.");
      setDeleting(false);
    }
  }

  return createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...boxStyle, maxWidth: "24rem", textAlign: "center" }} onClick={e => e.stopPropagation()}>
        <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", background: "#FEF2F2" }}>
          <span style={{ color: "#DC2626", fontSize: "1.5rem" }}>⚠</span>
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.5rem" }}>Remove Dentist?</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)", marginBottom: "0.25rem" }}>
          This will remove <strong style={{ color: "var(--ink)" }}>Dr. {dentist.profile?.full_name}</strong> from the roster.
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginBottom: "1.5rem" }}>Their account will remain but be reset to a patient role.</p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "0.625rem", borderRadius: "0.75rem", fontSize: "0.875rem", fontWeight: 500, background: "var(--bg)", color: "var(--ink)", border: "1px solid var(--border)", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: "0.625rem", borderRadius: "0.75rem", fontSize: "0.875rem", fontWeight: 500, background: "#DC2626", color: "white", border: "none", cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1 }}>
            {deleting ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function DentistsTable({ dentists }: { dentists: FullDentist[] }) {
  const [editing, setEditing] = useState<FullDentist | null>(null);
  const [deleting, setDeleting] = useState<FullDentist | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (dentists.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ background: "var(--surface)", border: "1px dashed var(--border)" }}>
        <p className="font-display text-lg mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--ink-muted)" }}>No dentists yet</p>
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>Click &ldquo;Add Dentist&rdquo; to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {dentists.map((d) => (
          <div key={d.id} className="card p-4 flex items-center gap-4 transition-all hover:-translate-y-px">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: "var(--accent)", color: "white" }}>
              {d.profile?.full_name ? getInitials(d.profile.full_name) : "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>Dr. {d.profile?.full_name}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
                {d.specialization} · {d.profile?.email}
              </p>
              {d.bio && (
                <p className="text-xs mt-1 truncate max-w-sm" style={{ color: "var(--ink-muted)" }}>{d.bio}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setEditing(d)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>
                Edit
              </button>
              <button onClick={() => setDeleting(d)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80" style={{ background: "#FEF2F2", color: "#DC2626" }}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {mounted && editing && <EditModal dentist={editing} onClose={() => setEditing(null)} />}
      {mounted && deleting && <DeleteModal dentist={deleting} onClose={() => setDeleting(null)} />}
    </>
  );
}
