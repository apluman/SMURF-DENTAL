"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

function ConfirmModal({
  onConfirm,
  onCancel,
  pending,
}: {
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
        borderRadius: "1rem", padding: "1.75rem", width: "100%", maxWidth: "400px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "50%",
          background: "rgba(220,38,38,0.1)", display: "flex",
          alignItems: "center", justifyContent: "center", marginBottom: "1rem",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.5rem" }}>
          Cancel appointment?
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
          This will cancel your appointment. You can book a new one anytime. Note that appointments cannot be cancelled within 24 hours of the scheduled time.
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
            Keep appointment
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
            {pending ? "Cancelling…" : "Yes, cancel"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Failed to cancel");
        setShowModal(false);
        return;
      }
      setShowModal(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          padding: "0.375rem 0.875rem", borderRadius: "0.5rem",
          border: "1px solid rgba(220,38,38,0.3)", background: "rgba(220,38,38,0.06)",
          color: "#DC2626", fontSize: "0.8125rem", fontWeight: 500,
          cursor: "pointer", whiteSpace: "nowrap",
        }}
      >
        Cancel
      </button>

      {error && (
        <p style={{ fontSize: "0.75rem", color: "#DC2626", marginTop: "4px" }}>{error}</p>
      )}

      {showModal && (
        <ConfirmModal
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
          pending={pending}
        />
      )}
    </>
  );
}
