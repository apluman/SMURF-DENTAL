"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Appointment } from "@/types";

type FullAppointment = Appointment & {
  patient: { full_name: string; email: string } | null;
  dentist: { profile: { full_name: string } | null } | null;
  service: { name: string } | null;
};

const STATUS_OPTIONS = ["pending", "confirmed", "cancelled", "completed"] as const;
const FILTER_TABS = ["all", ...STATUS_OPTIONS] as const;

type Status = typeof STATUS_OPTIONS[number];

const statusVariant: Record<Status, "default" | "secondary" | "destructive" | "outline"> = {
  confirmed: "default",
  pending: "outline",
  cancelled: "destructive",
  completed: "secondary",
};

interface Props {
  appointments: FullAppointment[];
  page: number;
  totalPages: number;
  total: number;
  filter: string;
  from: string;
  to: string;
}

export default function AdminAppointmentsTable({ appointments, page, totalPages, total, filter, from, to }: Props) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(appointments.map((a) => [a.id, a.status]))
  );

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    setStatuses((prev) => ({ ...prev, [id]: status }));
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setStatuses((prev) => ({ ...prev, [id]: appointments.find((a) => a.id === id)?.status ?? status }));
      toast.error("Failed to update status.");
    } else {
      toast.success("Status updated.");
    }
    router.refresh();
    setUpdating(null);
  }

  function applyDateFilter() {
    const params = new URLSearchParams();
    params.set("filter", filter);
    params.set("page", "1");
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    router.push(`?${params.toString()}`);
  }

  function clearDateFilter() {
    setFromDate("");
    setToDate("");
    router.push(`?filter=${filter}&page=1`);
  }

  const filterHref = (f: string) => {
    const params = new URLSearchParams({ filter: f, page: "1" });
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    return `?${params.toString()}`;
  };
  const pageHref = (p: number) => {
    const params = new URLSearchParams({ filter, page: String(p) });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return `?${params.toString()}`;
  };

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-3">
        {FILTER_TABS.map((f) => (
          <Link
            key={f}
            href={filterHref(f)}
            className="capitalize px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: filter === f ? "var(--accent)" : "transparent",
              border: "1px solid",
              borderColor: filter === f ? "var(--accent)" : "var(--border)",
              color: filter === f ? "white" : "var(--ink-muted)",
            }}
          >
            {f}
          </Link>
        ))}
      </div>

      {/* Date range filter */}
      <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", flexWrap: "wrap", marginBottom: "1rem" }}>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          style={{
            padding: "0.375rem 0.625rem", borderRadius: "0.5rem", fontSize: "0.8125rem",
            border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)",
          }}
        />
        <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>to</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          style={{
            padding: "0.375rem 0.625rem", borderRadius: "0.5rem", fontSize: "0.8125rem",
            border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)",
          }}
        />
        <button
          onClick={applyDateFilter}
          style={{
            padding: "0.375rem 0.875rem", borderRadius: "0.5rem", fontSize: "0.8125rem",
            background: "var(--accent)", color: "white", border: "none", cursor: "pointer", fontWeight: 500,
          }}
        >
          Apply
        </button>
        {(from || to) && (
          <button
            onClick={clearDateFilter}
            style={{
              padding: "0.375rem 0.875rem", borderRadius: "0.5rem", fontSize: "0.8125rem",
              background: "transparent", color: "var(--ink-muted)", border: "1px solid var(--border)", cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Dentist</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Date &amp; Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No appointments found.
                </TableCell>
              </TableRow>
            )}
            {appointments.map((appt) => {
              const currentStatus = (statuses[appt.id] ?? appt.status) as Status;
              return (
                <TableRow key={appt.id}>
                  <TableCell>
                    <p className="font-medium">{appt.patient?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{appt.patient?.email}</p>
                  </TableCell>
                  <TableCell>Dr. {appt.dentist?.profile?.full_name ?? "—"}</TableCell>
                  <TableCell>{appt.service?.name}</TableCell>
                  <TableCell>
                    <p>{appt.scheduled_date}</p>
                    <p className="text-xs text-muted-foreground">{appt.scheduled_time.slice(0, 5)}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[currentStatus] ?? "outline"} className="capitalize">
                      {currentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <select
                      value={currentStatus}
                      disabled={updating === appt.id}
                      onChange={(e) => updateStatus(appt.id, e.target.value)}
                      className="border border-input rounded-md px-2 py-1 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s} className="capitalize">{s}</option>
                      ))}
                    </select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
            Page {page} of {totalPages} · {total} record{total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ border: "1px solid var(--border)", color: "var(--ink-muted)" }}
              >
                Previous
              </Link>
            ) : (
              <span
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ border: "1px solid var(--border)", color: "var(--ink-muted)", opacity: 0.4 }}
              >
                Previous
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={pageHref(page + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: "var(--accent)", color: "white", border: "1px solid var(--accent)" }}
              >
                Next
              </Link>
            ) : (
              <span
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "var(--accent)", color: "white", border: "1px solid var(--accent)", opacity: 0.4 }}
              >
                Next
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
