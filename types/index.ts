export type Role = "admin" | "dentist" | "receptionist" | "patient";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: Role;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Dentist {
  id: string;
  profile_id: string;
  specialization: string;
  bio: string | null;
  google_calendar_id: string | null;
  google_refresh_token: string | null;
  created_at: string;
  profile?: Profile;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
}

export interface Schedule {
  id: string;
  dentist_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface BlockedDate {
  id: string;
  dentist_id: string | null;
  date: string;
  reason: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  dentist_id: string;
  service_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: AppointmentStatus;
  notes: string | null;
  google_event_id: string | null;
  created_at: string;
  updated_at: string;
  patient?: Profile;
  dentist?: Dentist;
  service?: Service;
}

export interface ClinicSettings {
  id: string;
  clinic_name: string;
  address: string;
  phone: string;
  email: string;
  slot_duration_minutes: number;
  booking_advance_days: number;
  updated_at: string;
}
