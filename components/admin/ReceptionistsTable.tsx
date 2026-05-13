"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Profile } from "@/types";

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
  maxWidth: "24rem",
  textAlign: "center",
};

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

function RemoveModal({ receptionist, onClose }: { receptionist: Profile; onClose: () => void }) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    const res = await fetch(`/api/admin/receptionists/${receptionist.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Receptionist removed.");
      router.refresh();
      onClose();
    } else {
      toast.error("Failed to remove receptionist.");
      setRemoving(false);
    }
  }

  return createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <div style={boxStyle} onClick={e => e.stopPropagation()}>
        <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", background: "#FEF2F2" }}>
          <span style={{ color: "#DC2626", fontSize: "1.5rem" }}>⚠</span>
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.5rem" }}>Remove Receptionist?</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)", marginBottom: "0.25rem" }}>
          This will remove <strong style={{ color: "var(--ink)" }}>{receptionist.full_name}</strong> from the receptionist roster.
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginBottom: "1.5rem" }}>Their account will remain but be reset to a patient role.</p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "0.625rem", borderRadius: "0.75rem", fontSize: "0.875rem", fontWeight: 500, background: "var(--bg)", color: "var(--ink)", border: "1px solid var(--border)", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleRemove} disabled={removing} style={{ flex: 1, padding: "0.625rem", borderRadius: "0.75rem", fontSize: "0.875rem", fontWeight: 500, background: "#DC2626", color: "white", border: "none", cursor: removing ? "not-allowed" : "pointer", opacity: removing ? 0.7 : 1 }}>
            {removing ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ReceptionistsTable({ receptionists }: { receptionists: Profile[] }) {
  const [removing, setRemoving] = useState<Profile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (receptionists.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ background: "var(--surface)", border: "1px dashed var(--border)" }}>
        <p className="font-display text-lg mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--ink-muted)" }}>No receptionists yet</p>
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>Click &ldquo;Add Receptionist&rdquo; to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {receptionists.map((r) => (
          <div key={r.id} className="card p-4 flex items-center gap-4 transition-all hover:-translate-y-px">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: "#93C5FD33", color: "#93C5FD" }}>
              {getInitials(r.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{r.full_name}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
                {r.email}{r.phone ? ` · ${r.phone}` : ""}
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => setRemoving(r)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80"
                style={{ background: "#FEF2F2", color: "#DC2626" }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {mounted && removing && <RemoveModal receptionist={removing} onClose={() => setRemoving(null)} />}
    </>
  );
}
