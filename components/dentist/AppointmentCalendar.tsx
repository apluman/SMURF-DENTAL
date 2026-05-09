"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useState } from "react";
import type { EventClickArg } from "@fullcalendar/core";

interface Appointment {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  notes?: string | null;
  patient: { full_name: string; phone?: string | null | undefined };
  service: { name: string; duration_minutes: number };
}

interface BlockedDate {
  id: string;
  date: string;
  reason?: string | null;
}

interface Props {
  appointments: Appointment[];
  blockedDates: BlockedDate[];
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  confirmed:  { bg: "#EAF4EF", border: "#1A7A5E", text: "#0F5132" },
  pending:    { bg: "#FEF6E7", border: "#C8963E", text: "#92560C" },
  cancelled:  { bg: "#FEF2F2", border: "#EF4444", text: "#991B1B" },
  completed:  { bg: "#F3F4F6", border: "#6B7280", text: "#374151" },
};

interface SelectedEvent {
  title: string;
  patient: string;
  phone?: string | null;
  service: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  notes?: string | null;
}

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = Number(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

export default function AppointmentCalendar({ appointments, blockedDates }: Props) {
  const [selected, setSelected] = useState<SelectedEvent | null>(null);

  const events = appointments.map((appt) => {
    const colors = STATUS_COLORS[appt.status] ?? STATUS_COLORS.completed!;
    const start = new Date(`${appt.scheduled_date}T${appt.scheduled_time}`);
    const end = new Date(start.getTime() + appt.service.duration_minutes * 60000);

    return {
      id: appt.id,
      title: `${appt.patient.full_name} · ${appt.service.name}`,
      start: start.toISOString(),
      end: end.toISOString(),
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: colors.text,
      extendedProps: {
        patient: appt.patient.full_name,
        phone: appt.patient.phone,
        service: appt.service.name,
        duration: appt.service.duration_minutes,
        status: appt.status,
        notes: appt.notes,
        date: appt.scheduled_date,
        time: appt.scheduled_time,
      },
    };
  });

  const blocked = blockedDates.map((b) => ({
    id: `blocked-${b.id}`,
    title: b.reason ? `Blocked: ${b.reason}` : "Blocked",
    start: b.date,
    allDay: true,
    display: "background",
    backgroundColor: "#FEE2E2",
    classNames: ["blocked-date"],
  }));

  function handleEventClick(info: EventClickArg) {
    const p = info.event.extendedProps;
    setSelected({
      title: info.event.title,
      patient: p.patient as string,
      phone: p.phone as string | null,
      service: p.service as string,
      date: p.date as string,
      time: p.time as string,
      duration: p.duration as number,
      status: p.status as string,
      notes: p.notes as string | null,
    });
  }

  return (
    <div>
      {/* Calendar */}
      <div
        className="card overflow-hidden"
        style={{ padding: "1.25rem" }}
      >
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={[...events, ...blocked]}
          eventClick={handleEventClick}
          height="auto"
          slotMinTime="07:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          nowIndicator
          slotDuration="00:30:00"
          eventDisplay="block"
          dayMaxEvents={3}
          buttonText={{ today: "Today", month: "Month", week: "Week", day: "Day" }}
        />
      </div>

      {/* Detail popover */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 animate-fade-up"
            style={{ background: "var(--surface)", boxShadow: "var(--shadow-md)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Status pill */}
            <div className="flex items-center justify-between mb-5">
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize badge-${selected.status}`}
              >
                {selected.status}
              </span>
              <button
                onClick={() => setSelected(null)}
                className="text-lg leading-none transition hover:opacity-60"
                style={{ color: "var(--ink-muted)" }}
              >
                ×
              </button>
            </div>

            <h3
              className="font-display text-xl font-semibold mb-4"
              style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
            >
              {selected.service}
            </h3>

            <div className="space-y-3">
              <Row label="Patient" value={selected.patient} />
              {selected.phone && <Row label="Phone" value={selected.phone} />}
              <Row label="Date" value={new Date(selected.date).toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} />
              <Row label="Time" value={`${formatTime(selected.time)} · ${selected.duration} min`} />
              {selected.notes && <Row label="Notes" value={selected.notes} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs font-semibold w-16 flex-shrink-0 pt-0.5" style={{ color: "var(--ink-muted)" }}>{label}</span>
      <span className="text-sm" style={{ color: "var(--ink)" }}>{value}</span>
    </div>
  );
}
