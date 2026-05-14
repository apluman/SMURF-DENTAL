import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCalendarEvent } from "@/lib/google-calendar";
import { sendBookingConfirmation } from "@/lib/email";
import { auditLog, getIp } from "@/lib/audit";
import { NextResponse } from "next/server";
import { addMinutes, parseISO } from "date-fns";
import { z } from "zod";

const schema = z.object({
  patient_id: z.string().uuid(),
  dentist_id: z.string().uuid(),
  service_id: z.string().uuid(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduled_time: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const ip = getIp(request);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["receptionist", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { patient_id, dentist_id, service_id, scheduled_date, scheduled_time, notes } = parsed.data;

  // Check for double-booking
  const { data: conflict } = await admin
    .from("appointments")
    .select("id")
    .eq("dentist_id", dentist_id)
    .eq("scheduled_date", scheduled_date)
    .eq("scheduled_time", scheduled_time)
    .neq("status", "cancelled")
    .limit(1)
    .maybeSingle();

  if (conflict) {
    return NextResponse.json({ error: "This time slot is already booked" }, { status: 409 });
  }

  const { data, error } = await admin
    .from("appointments")
    .insert({ patient_id, dentist_id, service_id, scheduled_date, scheduled_time, notes: notes ?? null, status: "confirmed" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auditLog({
    userId: user.id,
    action: "appointment.created",
    resourceType: "appointment",
    resourceId: data.id,
    metadata: { booked_by: profile.role, patient_id, dentist_id, service_id, scheduled_date },
    ipAddress: ip,
  });

  // Google Calendar sync
  try {
    const { data: dentist } = await admin
      .from("dentists")
      .select("google_refresh_token, google_calendar_id")
      .eq("id", dentist_id)
      .single();

    if (dentist?.google_refresh_token && dentist?.google_calendar_id) {
      const { data: details } = await admin
        .from("appointments")
        .select("*, patient:profiles(*), service:services(*)")
        .eq("id", data.id)
        .single();

      if (details) {
        const start = parseISO(`${details.scheduled_date}T${details.scheduled_time}`);
        const end = addMinutes(start, details.service.duration_minutes);
        const eventId = await createCalendarEvent(
          dentist.google_refresh_token,
          dentist.google_calendar_id,
          {
            summary: `${details.service.name} — ${details.patient.full_name}`,
            startDateTime: start.toISOString(),
            endDateTime: end.toISOString(),
          }
        );
        await admin.from("appointments").update({ google_event_id: eventId }).eq("id", data.id);
      }
    }
  } catch { /* non-fatal */ }

  // Confirmation email
  try {
    const { data: details } = await admin
      .from("appointments")
      .select("*, patient:profiles(*), dentist:dentists(*, profile:profiles(*)), service:services(*)")
      .eq("id", data.id)
      .single();

    if (details?.patient?.email) {
      await sendBookingConfirmation({
        patientName: details.patient.full_name,
        patientEmail: details.patient.email,
        dentistName: details.dentist.profile.full_name,
        serviceName: details.service.name,
        scheduledDate: details.scheduled_date,
        scheduledTime: details.scheduled_time,
        notes: details.notes,
      });
    }
  } catch { /* non-fatal */ }

  return NextResponse.json(data, { status: 201 });
}
