-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null,
  phone text,
  role text not null default 'patient' check (role in ('admin', 'dentist', 'receptionist', 'patient')),
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Services
create table public.services (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  duration_minutes int not null default 30,
  price numeric(10,2) not null,
  is_active boolean default true,
  created_at timestamptz default now() not null
);

-- Dentists
create table public.dentists (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null unique,
  specialization text not null,
  bio text,
  google_calendar_id text,
  google_refresh_token text,
  created_at timestamptz default now() not null
);

-- Schedules (weekly recurring)
create table public.schedules (
  id uuid default uuid_generate_v4() primary key,
  dentist_id uuid references public.dentists(id) on delete cascade not null,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean default true,
  unique(dentist_id, day_of_week)
);

-- Blocked dates
create table public.blocked_dates (
  id uuid default uuid_generate_v4() primary key,
  dentist_id uuid references public.dentists(id) on delete cascade,
  date date not null,
  reason text,
  created_at timestamptz default now() not null
);

-- Appointments
create table public.appointments (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  dentist_id uuid references public.dentists(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete restrict not null,
  scheduled_date date not null,
  scheduled_time time not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  google_event_id text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Clinic settings (single row)
create table public.clinic_settings (
  id uuid default uuid_generate_v4() primary key,
  clinic_name text not null default 'Smurf Dental Clinic',
  address text not null default '',
  phone text not null default '',
  email text not null default '',
  slot_duration_minutes int not null default 30,
  booking_advance_days int not null default 30,
  updated_at timestamptz default now() not null
);

insert into public.clinic_settings (clinic_name) values ('Smurf Dental Clinic');

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function update_updated_at();
create trigger appointments_updated_at before update on public.appointments
  for each row execute function update_updated_at();

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'patient')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.dentists enable row level security;
alter table public.schedules enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.appointments enable row level security;
alter table public.clinic_settings enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admin full access profiles" on public.profiles for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Services policies (public read, admin write)
create policy "Anyone can view active services" on public.services for select using (is_active = true);
create policy "Admin manages services" on public.services for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Dentists policies (public read)
create policy "Anyone can view dentists" on public.dentists for select using (true);
create policy "Admin manages dentists" on public.dentists for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Schedules policies
create policy "Anyone can view schedules" on public.schedules for select using (true);
create policy "Admin manages schedules" on public.schedules for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Dentist manages own schedule" on public.schedules for all using (
  exists (select 1 from public.dentists where id = dentist_id and profile_id = auth.uid())
);

-- Blocked dates policies
create policy "Anyone can view blocked dates" on public.blocked_dates for select using (true);
create policy "Admin manages blocked dates" on public.blocked_dates for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Appointments policies
create policy "Patients view own appointments" on public.appointments for select using (patient_id = auth.uid());
create policy "Patients create appointments" on public.appointments for insert with check (patient_id = auth.uid());
create policy "Patients cancel own appointments" on public.appointments for update using (
  patient_id = auth.uid() and status = 'pending'
);
create policy "Staff view all appointments" on public.appointments for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'receptionist', 'dentist'))
);
create policy "Staff manage appointments" on public.appointments for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'receptionist'))
);

-- Clinic settings (admin only)
create policy "Anyone can view clinic settings" on public.clinic_settings for select using (true);
create policy "Admin manages clinic settings" on public.clinic_settings for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
