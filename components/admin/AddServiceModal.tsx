"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

export default function AddServiceModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function handleClose() {
    setOpen(false);
    setName(""); setDescription(""); setDuration(30); setPrice(0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || undefined, duration_minutes: duration, price, is_active: true }),
    });
    if (!res.ok) {
      const data = await res.json() as { error: string };
      toast.error(typeof data.error === "string" ? data.error : "Failed to add service.");
      setSaving(false);
      return;
    }
    toast.success(`${name} added successfully.`);
    handleClose();
    router.refresh();
    setSaving(false);
  }

  const modal = open && (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: "var(--surface)",
          boxShadow: "var(--shadow-md)",
          borderRadius: "1rem",
          padding: "1.5rem",
          width: "100%",
          maxWidth: "28rem",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 600, color: "var(--ink)" }}>
            Add Service
          </h2>
          <button onClick={handleClose} style={{ fontSize: "1.25rem", lineHeight: 1, color: "var(--ink-muted)", background: "none", border: "none", cursor: "pointer" }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Service Name</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Tooth Cleaning, Braces Consultation" />
          </div>
          <div>
            <label style={labelStyle}>Description <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "72px" }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the service…" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Duration</label>
              <div style={{ position: "relative" }}>
                <input type="number" style={{ ...inputStyle, paddingRight: "3rem" }} value={duration} onChange={e => setDuration(Number(e.target.value))} min={10} max={240} step={5} required />
                <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "var(--ink-muted)", pointerEvents: "none" }}>min</span>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Price</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "var(--ink-muted)", pointerEvents: "none" }}>₱</span>
                <input type="number" style={{ ...inputStyle, paddingLeft: "1.75rem" }} value={price} onChange={e => setPrice(Number(e.target.value))} min={0} step={0.01} required />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.25rem" }}>
            <button type="button" onClick={handleClose} style={{ flex: 1, padding: "0.625rem", borderRadius: "0.75rem", fontSize: "0.875rem", fontWeight: 500, background: "var(--bg)", color: "var(--ink)", border: "1px solid var(--border)", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "0.625rem", borderRadius: "0.75rem", fontSize: "0.875rem", fontWeight: 500, background: "var(--accent)", color: "white", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Adding…" : "Add Service"}
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
        + Add Service
      </button>
      {mounted && createPortal(modal, document.body)}
    </>
  );
}
