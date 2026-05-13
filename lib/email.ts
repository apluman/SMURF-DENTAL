import nodemailer from "nodemailer";
import { format } from "date-fns";
import type { AppointmentStatus } from "@/types";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

interface AppointmentEmailData {
  patientName: string;
  patientEmail: string;
  dentistName: string;
  serviceName: string;
  scheduledDate: string;
  scheduledTime: string;
  notes?: string | null;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(date: string) {
  return format(new Date(date + "T00:00:00"), "MMMM d, yyyy");
}

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = Number(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display}:${m} ${ampm}`;
}

function baseTemplate(title: string, body: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="background:#0ea5e9;padding:28px 32px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">Smurf Dental Clinic</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 16px;font-size:18px;color:#111827;">${title}</h2>
            ${body}
            <p style="margin:32px 0 0;font-size:12px;color:#9ca3af;">
              This is an automated message from Smurf Dental Clinic. Please do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function detailRow(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;font-size:14px;color:#6b7280;width:140px;">${label}</td>
    <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${value}</td>
  </tr>`;
}

export async function sendBookingConfirmation(data: AppointmentEmailData) {
  const body = `
    <p style="margin:0 0 20px;font-size:14px;color:#374151;">
      Hi ${escapeHtml(data.patientName)}, your appointment has been received and is pending confirmation.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #e5e7eb;margin-bottom:20px;">
      ${detailRow("Dentist", `Dr. ${escapeHtml(data.dentistName)}`)}
      ${detailRow("Service", escapeHtml(data.serviceName))}
      ${detailRow("Date", escapeHtml(formatDate(data.scheduledDate)))}
      ${detailRow("Time", escapeHtml(formatTime(data.scheduledTime)))}
      ${data.notes ? detailRow("Notes", escapeHtml(data.notes)) : ""}
    </table>
    <p style="margin:0;font-size:14px;color:#374151;">
      We will notify you once your appointment is confirmed. If you have questions, please contact the clinic directly.
    </p>`;

  await getTransporter().sendMail({
    from: `"Smurf Dental Clinic" <${process.env.EMAIL_FROM}>`,
    to: data.patientEmail,
    subject: "Appointment Request Received — Smurf Dental Clinic",
    html: baseTemplate("Appointment Request Received", body),
  });
}

export async function sendStatusUpdate(
  data: AppointmentEmailData,
  status: AppointmentStatus
) {
  const statusConfig: Record<string, { subject: string; headline: string; message: string; color: string }> = {
    confirmed: {
      subject: "Appointment Confirmed — Smurf Dental Clinic",
      headline: "Your Appointment is Confirmed",
      message: "Great news! Your appointment has been confirmed. Please arrive 5–10 minutes early.",
      color: "#16a34a",
    },
    cancelled: {
      subject: "Appointment Cancelled — Smurf Dental Clinic",
      headline: "Your Appointment Has Been Cancelled",
      message: "Your appointment has been cancelled. Please contact the clinic to reschedule.",
      color: "#dc2626",
    },
    completed: {
      subject: "Appointment Completed — Thank You!",
      headline: "Thank You for Your Visit",
      message: "Thank you for visiting Smurf Dental Clinic. We hope to see you again soon!",
      color: "#0ea5e9",
    },
  };

  const config = statusConfig[status];
  if (!config) return;

  const body = `
    <div style="border-left:4px solid ${config.color};padding-left:16px;margin-bottom:20px;">
      <p style="margin:0;font-size:14px;color:#374151;">${config.message}</p>
    </div>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #e5e7eb;margin-bottom:20px;">
      ${detailRow("Dentist", `Dr. ${escapeHtml(data.dentistName)}`)}
      ${detailRow("Service", escapeHtml(data.serviceName))}
      ${detailRow("Date", escapeHtml(formatDate(data.scheduledDate)))}
      ${detailRow("Time", escapeHtml(formatTime(data.scheduledTime)))}
    </table>`;

  await getTransporter().sendMail({
    from: `"Smurf Dental Clinic" <${process.env.EMAIL_FROM}>`,
    to: data.patientEmail,
    subject: config.subject,
    html: baseTemplate(config.headline, body),
  });
}
