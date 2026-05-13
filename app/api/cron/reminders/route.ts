import { createAdminClient } from "@/lib/supabase/admin";
import { sendReminderEmail } from "@/lib/email";
import { auditLog } from "@/lib/audit";
import { NextResponse } from "next/server";
import { format, addDays } from "date-fns";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const admin = createAdminClient();

  const { data: appointments, error } = await admin
    .from("appointments")
    .select("*, patient:profiles!patient_id(full_name, email), dentist:dentists(*, profile:profiles(full_name)), service:services(name)")
    .eq("scheduled_date", tomorrow)
    .in("status", ["confirmed", "pending"])
    .eq("reminder_sent", false);

  if (error) {
    console.error("[cron/reminders] Query failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const appt of appointments ?? []) {
    const patient = appt.patient as { full_name: string; email: string } | null;
    const dentist = appt.dentist as { profile: { full_name: string } } | null;
    const service = appt.service as { name: string } | null;

    if (!patient?.email) continue;

    try {
      await sendReminderEmail({
        patientName: patient.full_name,
        patientEmail: patient.email,
        dentistName: dentist?.profile?.full_name ?? "your dentist",
        serviceName: service?.name ?? "your appointment",
        scheduledDate: appt.scheduled_date,
        scheduledTime: appt.scheduled_time,
        notes: appt.notes ?? null,
      });

      await admin.from("appointments").update({ reminder_sent: true }).eq("id", appt.id);
      await auditLog({
        userId: appt.patient_id,
        action: "appointment.reminder_sent",
        resourceType: "appointment",
        resourceId: appt.id,
      });

      sent++;
    } catch (err) {
      console.error(`[cron/reminders] Failed for appointment ${appt.id}:`, err);
      failed++;
    }
  }

  console.log(`[cron/reminders] Sent: ${sent}, Failed: ${failed}`);
  return NextResponse.json({ sent, failed, date: tomorrow });
}
