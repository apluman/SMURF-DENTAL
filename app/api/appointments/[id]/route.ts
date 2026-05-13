import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateAppointmentSchema } from "@/lib/validations/appointment";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google-calendar";
import { sendStatusUpdate } from "@/lib/email";
import { auditLog, getIp } from "@/lib/audit";
import { NextResponse } from "next/server";
import { addMinutes, parseISO } from "date-fns";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const role = profile?.role ?? "";

  const { id } = await params;

  // Patients can only cancel their own appointments, 24hr+ in advance
  if (role === "patient") {
    const { data: appt } = await admin
      .from("appointments")
      .select("patient_id, status, scheduled_date, scheduled_time")
      .eq("id", id)
      .single();

    if (!appt || appt.patient_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!["pending", "confirmed"].includes(appt.status)) {
      return NextResponse.json({ error: "This appointment cannot be cancelled" }, { status: 400 });
    }

    const apptDateTime = new Date(`${appt.scheduled_date}T${appt.scheduled_time}`);
    const hoursUntil = (apptDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < 24) {
      return NextResponse.json({ error: "Appointments cannot be cancelled within 24 hours of the scheduled time" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await auditLog({
      userId: user.id,
      action: "appointment.cancelled",
      resourceType: "appointment",
      resourceId: id,
      metadata: { cancelled_by: "patient" },
      ipAddress: getIp(request),
    });

    // Remove from Google Calendar
    try {
      const { data: dentist } = await admin
        .from("dentists")
        .select("google_refresh_token, google_calendar_id")
        .eq("id", data.dentist_id)
        .single();
      if (dentist?.google_refresh_token && dentist?.google_calendar_id && data.google_event_id) {
        await deleteCalendarEvent(dentist.google_refresh_token, dentist.google_calendar_id, data.google_event_id);
        await admin.from("appointments").update({ google_event_id: null }).eq("id", id);
      }
    } catch { /* non-fatal */ }

    // Send cancellation email
    try {
      const { data: details } = await admin
        .from("appointments")
        .select("*, patient:profiles(*), dentist:dentists(*, profile:profiles(*)), service:services(*)")
        .eq("id", id)
        .single();
      if (details?.patient?.email) {
        await sendStatusUpdate(
          {
            patientName: details.patient.full_name,
            patientEmail: details.patient.email,
            dentistName: details.dentist.profile.full_name,
            serviceName: details.service.name,
            scheduledDate: details.scheduled_date,
            scheduledTime: details.scheduled_time,
          },
          "cancelled"
        );
      }
    } catch { /* non-fatal */ }

    return NextResponse.json(data);
  }

  if (!["admin", "receptionist", "dentist"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await request.json();
  const parsed = updateAppointmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Dentists can only update their own appointments and only to confirmed/completed
  if (role === "dentist") {
    const { data: dentist } = await admin
      .from("dentists")
      .select("id")
      .eq("profile_id", user.id)
      .single();
    const { data: appt } = await admin
      .from("appointments")
      .select("dentist_id")
      .eq("id", id)
      .single();
    if (!dentist || appt?.dentist_id !== dentist.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (parsed.data.status && !["confirmed", "completed"].includes(parsed.data.status)) {
      return NextResponse.json({ error: "Dentists can only set confirmed or completed" }, { status: 403 });
    }
  }
  const { data, error } = await admin
    .from("appointments")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auditLog({
    userId: user.id,
    action: "appointment.updated",
    resourceType: "appointment",
    resourceId: id,
    metadata: { changes: parsed.data, role },
    ipAddress: getIp(request),
  });

  // Sync calendar
  try {
    const { data: dentist } = await admin
      .from("dentists")
      .select("google_refresh_token, google_calendar_id")
      .eq("id", data.dentist_id)
      .single();

    if (dentist?.google_refresh_token && dentist?.google_calendar_id) {
      if (data.status === "cancelled" && data.google_event_id) {
        await deleteCalendarEvent(
          dentist.google_refresh_token,
          dentist.google_calendar_id,
          data.google_event_id
        );
        await admin.from("appointments").update({ google_event_id: null }).eq("id", id);
      } else if (data.status !== "cancelled") {
        const { data: details } = await admin
          .from("appointments")
          .select("*, patient:profiles(*), service:services(*)")
          .eq("id", id)
          .single();

        if (details) {
          const startIso = `${details.scheduled_date}T${details.scheduled_time}`;
          const start = parseISO(startIso);
          const end = addMinutes(start, details.service.duration_minutes);

          const eventPayload = {
            summary: `${details.service.name} — ${details.patient.full_name}`,
            startDateTime: start.toISOString(),
            endDateTime: end.toISOString(),
          };

          if (data.google_event_id) {
            await updateCalendarEvent(
              dentist.google_refresh_token,
              dentist.google_calendar_id,
              data.google_event_id,
              eventPayload
            );
          } else {
            const eventId = await createCalendarEvent(
              dentist.google_refresh_token,
              dentist.google_calendar_id,
              eventPayload
            );
            await admin.from("appointments").update({ google_event_id: eventId }).eq("id", id);
          }
        }
      }
    }
  } catch {
    // Calendar sync is non-fatal — DB update already succeeded
  }

  // Send status update email for patient-facing statuses
  if (parsed.data.status && ["confirmed", "cancelled", "completed"].includes(parsed.data.status)) {
    try {
      const { data: details } = await admin
        .from("appointments")
        .select("*, patient:profiles(*), dentist:dentists(*, profile:profiles(*)), service:services(*)")
        .eq("id", id)
        .single();

      if (details?.patient?.email) {
        await sendStatusUpdate(
          {
            patientName: details.patient.full_name,
            patientEmail: details.patient.email,
            dentistName: details.dentist.profile.full_name,
            serviceName: details.service.name,
            scheduledDate: details.scheduled_date,
            scheduledTime: details.scheduled_time,
          },
          parsed.data.status
        );
      }
    } catch {
      // Email is non-fatal — DB update already succeeded
    }
  }

  return NextResponse.json(data);
}
