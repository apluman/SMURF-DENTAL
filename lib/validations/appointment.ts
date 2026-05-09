import { z } from "zod";

export const createAppointmentSchema = z.object({
  dentist_id: z.string().uuid("Invalid dentist"),
  service_id: z.string().uuid("Invalid service"),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  scheduled_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  notes: z.string().max(500, "Notes too long").optional(),
});

export const updateAppointmentSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
  notes: z.string().max(500).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
