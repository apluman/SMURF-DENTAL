"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { ClinicSettings } from "@/types";

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--accent)" }}>
      {children}
    </p>
  );
}

export default function ClinicSettingsForm({ settings }: { settings: ClinicSettings | null }) {
  const [form, setForm] = useState({
    clinic_name: settings?.clinic_name ?? "",
    address: settings?.address ?? "",
    phone: settings?.phone ?? "",
    email: settings?.email ?? "",
    slot_duration_minutes: settings?.slot_duration_minutes ?? 30,
    booking_advance_days: settings?.booking_advance_days ?? 30,
  });
  const [saving, setSaving] = useState(false);

  function set(key: string, value: string | number) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json() as { error: string };
      toast.error(typeof data.error === "string" ? data.error : "Failed to save settings.");
    } else {
      toast.success("Settings saved successfully.");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSave} className="space-y-7">

      {/* Clinic Info */}
      <section>
        <SectionTitle>Clinic Information</SectionTitle>
        <div className="space-y-4">
          <div>
            <label style={labelStyle}>Clinic Name</label>
            <input style={inputStyle} type="text" value={form.clinic_name} onChange={e => set("clinic_name", e.target.value)} placeholder="e.g. Smurf Dental Clinic" />
          </div>
          <div>
            <label style={labelStyle}>Address</label>
            <input style={inputStyle} type="text" value={form.address} onChange={e => set("address", e.target.value)} placeholder="Street, Barangay, City, Province" />
          </div>
        </div>
      </section>

      <div style={{ height: "1px", background: "var(--border)" }} />

      {/* Contact */}
      <section>
        <SectionTitle>Contact Details</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} type="text" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+63 XXX XXX XXXX" />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="clinic@email.com" />
          </div>
        </div>
      </section>

      <div style={{ height: "1px", background: "var(--border)" }} />

      {/* Booking Config */}
      <section>
        <SectionTitle>Booking Configuration</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Slot Duration</label>
            <div className="relative">
              <input
                style={{ ...inputStyle, paddingRight: "3rem" }}
                type="number"
                value={form.slot_duration_minutes}
                onChange={e => set("slot_duration_minutes", Number(e.target.value))}
                min={10} max={120} step={5}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: "var(--ink-muted)" }}>min</span>
            </div>
            <p className="text-xs mt-1.5" style={{ color: "var(--ink-muted)" }}>Length of each bookable time block</p>
          </div>
          <div>
            <label style={labelStyle}>Booking Window</label>
            <div className="relative">
              <input
                style={{ ...inputStyle, paddingRight: "3.5rem" }}
                type="number"
                value={form.booking_advance_days}
                onChange={e => set("booking_advance_days", Number(e.target.value))}
                min={1} max={365}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: "var(--ink-muted)" }}>days</span>
            </div>
            <p className="text-xs mt-1.5" style={{ color: "var(--ink-muted)" }}>How far ahead patients can book</p>
          </div>
        </div>

        {/* Visual summary */}
        <div className="mt-4 rounded-xl p-4" style={{ background: "var(--accent-subtle)", border: "1px solid rgba(26,122,94,0.15)" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--accent)" }}>Current Configuration</p>
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
            Patients can book appointments in <strong style={{ color: "var(--ink)" }}>{form.slot_duration_minutes}-minute</strong> slots,
            up to <strong style={{ color: "var(--ink)" }}>{form.booking_advance_days} days</strong> in advance.
          </p>
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-60"
        style={{ background: "var(--accent)", color: "white" }}
      >
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </form>
  );
}
