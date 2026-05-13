"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import SessionMonitor from "./SessionMonitor";
import type { Profile } from "@/types";

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function ToothIcon() {
  return (
    <svg width="16" height="20" viewBox="0 0 60 72" fill="none">
      <path d="M10 22C10 11 18 4 30 4C42 4 50 11 50 22V42C50 54 43 60 36 63L33 68C31.5 71.5 28.5 71.5 27 68L24 63C17 60 10 54 10 42V22Z" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round"/>
      <path d="M20 22C20 16 24.5 13 30 13C35.5 13 40 16 40 22" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

export default function DashboardShell({
  profile,
  children,
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* Overlay when sidebar open */}
      {open && (
        <div
          className="fixed inset-0 z-20"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — always a fixed slide-in drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-30 flex-shrink-0 transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar profile={profile} />
      </div>

      {/* Main content — always full width */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
        >
          <button
            onClick={() => setOpen(v => !v)}
            className="p-2 rounded-lg transition"
            style={{ color: "var(--ink-muted)" }}
            aria-label="Toggle sidebar"
          >
            <MenuIcon />
          </button>
          <div className="flex items-center gap-2">
            <ToothIcon />
            <span
              className="font-semibold text-base"
              style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
            >
              Smurf Dental
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-10">
          {children}
        </main>
      </div>

      <SessionMonitor />
    </div>
  );
}
