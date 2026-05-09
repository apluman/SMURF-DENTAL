import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { format, parse, addMinutes } from "date-fns";
import { z } from "zod";

const slotsQuerySchema = z.object({
  dentist_id: z.string().uuid("Invalid dentist ID"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = slotsQuerySchema.safeParse({
    dentist_id: searchParams.get("dentist_id"),
    date: searchParams.get("date"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { dentist_id: dentistId, date } = parsed.data;

  const supabase = createAdminClient();
  const dayOfWeek = new Date(date).getDay();

  const [{ data: schedule }, { data: blocked }, { data: booked }, { data: settings }] =
    await Promise.all([
      supabase
        .from("schedules")
        .select("*")
        .eq("dentist_id", dentistId)
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true)
        .single(),
      supabase
        .from("blocked_dates")
        .select("*")
        .eq("date", date)
        .or(`dentist_id.eq.${dentistId},dentist_id.is.null`),
      supabase
        .from("appointments")
        .select("scheduled_time")
        .eq("dentist_id", dentistId)
        .eq("scheduled_date", date)
        .in("status", ["pending", "confirmed"]),
      supabase.from("clinic_settings").select("slot_duration_minutes").single(),
    ]);

  if (!schedule || (blocked && blocked.length > 0)) {
    return NextResponse.json({ slots: [] });
  }

  const slotDuration = settings?.slot_duration_minutes ?? 30;
  const bookedTimes = new Set((booked ?? []).map((b) => b.scheduled_time.slice(0, 5)));

  const slots: string[] = [];
  let current = parse(schedule.start_time, "HH:mm:ss", new Date());
  const end = parse(schedule.end_time, "HH:mm:ss", new Date());

  while (current < end) {
    const timeStr = format(current, "HH:mm");
    if (!bookedTimes.has(timeStr)) {
      slots.push(timeStr);
    }
    current = addMinutes(current, slotDuration);
  }

  return NextResponse.json({ slots });
}
