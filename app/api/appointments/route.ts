import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAppointmentSchema } from "@/lib/validations/appointment";
import { createCalendarEvent } from "@/lib/google-calendar";
import { sendBookingConfirmation } from "@/lib/email";
import { NextResponse } from "next/server";
import { addMinutes, parseISO } from "date-fns";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Use user-scoped client so RLS enforces patient_id ownership
  const { data, error } = await supabase
    .from("appointments")
    .select("*, dentist:dentists(*, profile:profiles(*)), service:services(*)")
    .eq("patient_id", user.id)
    .order("scheduled_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = createAppointmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Reject past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const apptDate = new Date(parsed.data.scheduled_date + "T00:00:00");
  if (apptDate < today) {
    return NextResponse.json({ error: "Cannot book appointments in the past" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Enforce clinic booking window
  const { data: settings } = await admin.from("clinic_settings").select("booking_advance_days").single();
  const maxDays = settings?.booking_advance_days ?? 30;
  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() + maxDays);
  limitDate.setHours(23, 59, 59, 999);
  if (apptDate > limitDate) {
    return NextResponse.json({ error: `Appointments can only be booked up to ${maxDays} days in advance` }, { status: 400 });
  }

  // Reject double-booking the same dentist slot
  const { data: conflict } = await admin
    .from("appointments")
    .select("id")
    .eq("dentist_id", parsed.data.dentist_id)
    .eq("scheduled_date", parsed.data.scheduled_date)
    .eq("scheduled_time", parsed.data.scheduled_time)
    .neq("status", "cancelled")
    .limit(1)
    .maybeSingle();

  if (conflict) {
    return NextResponse.json({ error: "This time slot is no longer available" }, { status: 409 });
  }

  const { data, error } = await admin
    .from("appointments")
    .insert({ ...parsed.data, patient_id: user.id, status: "pending" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sync to Google Calendar if dentist has connected
  try {
    const { data: dentist } = await admin
      .from("dentists")
      .select("google_refresh_token, google_calendar_id")
      .eq("id", data.dentist_id)
      .single();

    if (dentist?.google_refresh_token && dentist?.google_calendar_id) {
      const { data: details } = await admin
        .from("appointments")
        .select("*, patient:profiles(*), service:services(*)")
        .eq("id", data.id)
        .single();

      if (details) {
        const startIso = `${details.scheduled_date}T${details.scheduled_time}`;
        const start = parseISO(startIso);
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

        await admin
          .from("appointments")
          .update({ google_event_id: eventId })
          .eq("id", data.id);
      }
    }
  } catch {
    // Calendar sync is non-fatal — appointment already saved
  }

  // Send booking confirmation email
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
  } catch {
    // Email is non-fatal — appointment already saved
  }

  return NextResponse.json(data, { status: 201 });
}
