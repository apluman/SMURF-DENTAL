"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const WARN_BEFORE_MS = 5 * 60 * 1000; // warn 5 min before expiry
const CHECK_INTERVAL_MS = 60 * 1000;  // check every minute

export default function SessionMonitor() {
  const router = useRouter();
  const [state, setState] = useState<"ok" | "expiring" | "expired">("ok");
  const [renewingSession, setRenewingSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState("expired");
        return;
      }
      const expiresAt = (session.expires_at ?? 0) * 1000;
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        setState("expired");
      } else if (remaining <= WARN_BEFORE_MS) {
        setState("expiring");
      } else {
        setState("ok");
      }
    }

    checkSession();
    const interval = setInterval(checkSession, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (state === "expired") {
      const t = setTimeout(() => router.push("/login"), 3000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [state, router]);

  async function handleRenew() {
    setRenewingSession(true);
    const supabase = createClient();
    await supabase.auth.refreshSession();
    setState("ok");
    setRenewingSession(false);
  }

  if (state === "ok") return null;

  if (state === "expired") {
    return (
      <div style={{
        position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)",
        zIndex: 9999, background: "#DC2626", color: "white",
        padding: "0.875rem 1.5rem", borderRadius: "0.875rem",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)", fontSize: "0.875rem",
        fontWeight: 500, whiteSpace: "nowrap",
      }}>
        Session expired — redirecting to login…
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, background: "var(--surface)", border: "1px solid var(--border)",
      padding: "0.875rem 1.25rem", borderRadius: "0.875rem",
      boxShadow: "0 8px 32px rgba(0,0,0,0.15)", fontSize: "0.875rem",
      display: "flex", alignItems: "center", gap: "1rem", whiteSpace: "nowrap",
    }}>
      <span style={{ color: "var(--ink)" }}>
        ⚠ Your session is expiring soon
      </span>
      <button
        onClick={handleRenew}
        disabled={renewingSession}
        style={{
          padding: "0.375rem 0.875rem", borderRadius: "0.5rem",
          background: "var(--accent)", color: "white",
          fontSize: "0.8125rem", fontWeight: 600, border: "none",
          cursor: renewingSession ? "not-allowed" : "pointer",
          opacity: renewingSession ? 0.7 : 1,
        }}
      >
        {renewingSession ? "Renewing…" : "Stay signed in"}
      </button>
    </div>
  );
}
