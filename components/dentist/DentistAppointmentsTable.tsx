"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Appointment {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  notes: string | null;
  patient: { full_name: string; email: string; phone: string | null } | null;
  service: { name: string; duration_minutes: number } | null;
}

const STATUS_COLOR: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-gray-100 text-gray-700",
};

const DENTIST_STATUS_OPTIONS = ["confirmed", "completed"] as const;
const ALL_FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"] as const;

export default function DentistAppointmentsTable({ appointments }: { appointments: Appointment[] }) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(appointments.map((a) => [a.id, a.status]))
  );

  const filtered = filter === "all"
    ? appointments
    : appointments.filter((a) => (statuses[a.id] ?? a.status) === filter);

  async function updateStatus(id: string, status: string, originalStatus: string) {
    setUpdating(id);
    setStatuses((s) => ({ ...s, [id]: status }));
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setStatuses((s) => ({ ...s, [id]: originalStatus }));
      toast.error("Failed to update status.");
    } else {
      toast.success("Status updated.");
      router.refresh();
    }
    setUpdating(null);
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {ALL_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              filter === f
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {!filtered.length ? (
          <div className="text-center py-16 text-gray-400 text-sm">No appointments found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Patient", "Contact", "Service", "Date & Time", "Notes", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((appt) => {
                const currentStatus = statuses[appt.id] ?? appt.status;
                const isDone = currentStatus === "cancelled" || currentStatus === "completed";
                return (
                  <tr key={appt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{appt.patient?.full_name}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-600 text-xs">{appt.patient?.email}</p>
                      <p className="text-gray-400 text-xs">{appt.patient?.phone ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{appt.service?.name}</p>
                      <p className="text-gray-400 text-xs">{appt.service?.duration_minutes} min</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{appt.scheduled_date}</p>
                      <p className="text-gray-400 text-xs">{appt.scheduled_time.slice(0, 5)}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[150px] truncate">{appt.notes ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLOR[currentStatus] ?? "bg-gray-100 text-gray-700"}`}>
                        {currentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isDone ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : (
                        <select
                          value={currentStatus}
                          disabled={updating === appt.id}
                          onChange={(e) => updateStatus(appt.id, e.target.value, currentStatus)}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                        >
                          <option value={currentStatus} disabled>{currentStatus}</option>
                          {DENTIST_STATUS_OPTIONS.filter((s) => s !== currentStatus).map((s) => (
                            <option key={s} value={s} className="capitalize">{s}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
