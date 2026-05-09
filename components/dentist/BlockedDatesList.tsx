"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface BlockedDate {
  id: string;
  date: string;
  reason?: string | null;
}

interface Props {
  blockedDates: BlockedDate[];
  dentistId: string;
}

function parseLocalDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00");
}

function formatMonth(dateStr: string) {
  return parseLocalDate(dateStr).toLocaleString("en-US", { month: "short" });
}

function formatDay(dateStr: string) {
  return parseLocalDate(dateStr).getDate();
}

export default function BlockedDatesList({ blockedDates, dentistId }: Props) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);

  async function unblock(id: string) {
    setRemoving(id);
    try {
      const res = await fetch("/api/dentist/blocked-dates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, dentist_id: dentistId }),
      });
      if (!res.ok) throw new Error();
      toast.success("Date unblocked.");
      router.refresh();
    } catch {
      toast.error("Failed to unblock date.");
    } finally {
      setRemoving(null);
    }
  }

  if (!blockedDates.length) {
    return (
      <div style={{ background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "0.75rem", padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem" }}>No blocked dates set.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {blockedDates.map(b => (
        <div key={b.id} className="card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem", background: "#FEF2F2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <p style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", color: "#DC2626", lineHeight: 1 }}>
              {formatMonth(b.date)}
            </p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "#DC2626", lineHeight: 1.2 }}>
              {formatDay(b.date)}
            </p>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--ink)" }}>{b.date}</p>
            {b.reason && (
              <p style={{ fontSize: "0.75rem", marginTop: "0.125rem", color: "var(--ink-muted)" }}>{b.reason}</p>
            )}
          </div>
          <button
            onClick={() => unblock(b.id)}
            disabled={removing === b.id}
            style={{
              padding: "0.375rem 0.875rem",
              borderRadius: "0.5rem",
              border: "1px solid #FECACA",
              background: "transparent",
              color: "#DC2626",
              fontSize: "0.75rem",
              fontWeight: 500,
              cursor: removing === b.id ? "not-allowed" : "pointer",
              opacity: removing === b.id ? 0.6 : 1,
              flexShrink: 0,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { if (removing !== b.id) (e.currentTarget as HTMLElement).style.background = "#FEF2F2"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            {removing === b.id ? "Removing…" : "Unblock"}
          </button>
        </div>
      ))}
    </div>
  );
}
