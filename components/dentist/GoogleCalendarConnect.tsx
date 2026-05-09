"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  isConnected: boolean;
}

export default function GoogleCalendarConnect({ isConnected }: Props) {
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);
  const [hovered, setHovered] = useState(false);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/auth/google/disconnect", { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("Google Calendar disconnected");
      router.refresh();
    } catch {
      toast.error("Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  }

  if (isConnected) {
    return (
      <button
        onClick={handleDisconnect}
        disabled={disconnecting}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 disabled:opacity-50"
        style={{
          background: hovered ? "#FEF2F2" : "var(--accent-subtle)",
          border: `1px solid ${hovered ? "#FECACA" : "rgba(26,122,94,0.25)"}`,
          color: hovered ? "#DC2626" : "var(--accent)",
        }}
      >
        {/* Pulse dot */}
        <span className="relative flex h-1.5 w-1.5">
          {!hovered && (
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
              style={{ background: "var(--accent)" }}
            />
          )}
          <span
            className="relative inline-flex rounded-full h-1.5 w-1.5"
            style={{ background: hovered ? "#DC2626" : "var(--accent)" }}
          />
        </span>
        {disconnecting ? "Disconnecting…" : hovered ? "Disconnect Google Calendar" : "Synced with Google Calendar"}
      </button>
    );
  }

  return (
    <a
      href="/api/auth/google"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
      style={{
        background: hovered ? "var(--accent)" : "transparent",
        border: "1px solid var(--border)",
        color: hovered ? "white" : "var(--ink-muted)",
      }}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span
          className="relative inline-flex rounded-full h-1.5 w-1.5"
          style={{ background: "var(--ink-muted)" }}
        />
      </span>
      Connect Google Calendar
    </a>
  );
}
