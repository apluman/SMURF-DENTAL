"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import type { Profile } from "@/types";
import { logoutAction } from "@/app/actions/auth";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarPlus,
  CalendarClock,
  Users,
  Scissors,
  Settings2,
  UserCircle,
  LogOut,
  UserCog,
} from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
  Dashboard: LayoutDashboard,
  Appointments: CalendarDays,
  "Book Appointment": CalendarPlus,
  "My Schedule": CalendarClock,
  Dentists: Users,
  Services: Scissors,
  Settings: Settings2,
  Profile: UserCircle,
  Patients: Users,
  Receptionists: UserCog,
};

const NAV: Record<string, { label: string; href: string }[]> = {
  admin: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Appointments", href: "/admin/appointments" },
    { label: "Dentists", href: "/admin/dentists" },
    { label: "Receptionists", href: "/admin/receptionists" },
    { label: "Services", href: "/admin/services" },
    { label: "Settings", href: "/admin/settings" },
  ],
  dentist: [
    { label: "Dashboard", href: "/dentist/dashboard" },
    { label: "My Schedule", href: "/dentist/schedule" },
    { label: "Appointments", href: "/dentist/appointments" },
  ],
  receptionist: [
    { label: "Dashboard", href: "/receptionist/dashboard" },
    { label: "Appointments", href: "/receptionist/appointments" },
    { label: "Patients", href: "/receptionist/patients" },
  ],
  patient: [
    { label: "Dashboard", href: "/patient/dashboard" },
    { label: "Book Appointment", href: "/patient/book" },
    { label: "Appointments", href: "/patient/appointments" },
    { label: "Profile", href: "/patient/profile" },
  ],
};

const ROLE_COLORS: Record<string, string> = {
  admin: "#F5D58B",
  dentist: "#6EE7B7",
  receptionist: "#93C5FD",
  patient: "#FCA5A5",
};

function ToothIcon() {
  return (
    <svg width="20" height="24" viewBox="0 0 60 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 22C10 11 18 4 30 4C42 4 50 11 50 22V42C50 54 43 60 36 63L33 68C31.5 71.5 28.5 71.5 27 68L24 63C17 60 10 54 10 42V22Z"
        stroke="#6EE7B7" strokeWidth="3" strokeLinejoin="round"
      />
      <path d="M20 22C20 16 24.5 13 30 13C35.5 13 40 16 40 22" stroke="#6EE7B7" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M24 63L21 70" stroke="#6EE7B7" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M36 63L39 70" stroke="#6EE7B7" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const role = profile?.role ?? "patient";
  const links = NAV[role] ?? [];
  const roleColor = ROLE_COLORS[role] ?? "#E5E7EB";

  return (
    <aside
      className="w-60 h-full flex flex-col flex-shrink-0"
      style={{ background: "var(--sidebar-bg)", borderRight: "1px solid rgba(255,255,255,0.04)" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-7" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <ToothIcon />
        <div>
          <p
            className="font-display font-semibold leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "white", fontSize: "1.05rem" }}
          >
            Smurf Dental
          </p>
          <p className="text-[10px] tracking-widest uppercase font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Clinic
          </p>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-5 pt-5 pb-2">
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: `${roleColor}18`, color: roleColor, border: `1px solid ${roleColor}30` }}
        >
          {role}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = ICONS[link.label] ?? LayoutDashboard;
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={
                isActive
                  ? {
                      background: "var(--sidebar-active)",
                      color: "#6EE7B7",
                      borderLeft: "2px solid #6EE7B7",
                      paddingLeft: "10px",
                    }
                  : {
                      color: "rgba(255,255,255,0.5)",
                      borderLeft: "2px solid transparent",
                    }
              }
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover)";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
                }
              }}
            >
              <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "var(--accent)", color: "white" }}
          >
            {profile?.full_name ? getInitials(profile.full_name) : "?"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
              {profile?.full_name ?? "User"}
            </p>
            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.3)" }}>
              {profile?.email ?? ""}
            </p>
          </div>
        </div>
        <form action={() => startTransition(() => logoutAction())}>
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 text-xs font-medium w-full px-3 py-2 rounded-lg transition-all duration-150"
            style={{ color: pending ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.35)", cursor: pending ? "not-allowed" : "pointer" }}
            onMouseEnter={e => {
              if (pending) return;
              (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.12)";
              (e.currentTarget as HTMLElement).style.color = "#FCA5A5";
            }}
            onMouseLeave={e => {
              if (pending) return;
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)";
            }}
          >
            <LogOut size={13} />
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </form>
      </div>
    </aside>
  );
}
