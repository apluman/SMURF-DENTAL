README
Features:
- Patient online booking
- Select dentist, service, date, and time
- Real-time available slots
- Admin dashboard
- Appointment management
- Google Calendar sync
- Email notifications
- Mobile responsive UI
- Role-based access (admin, dentist, receptionist, patient)

Security:
- Enable Supabase RLS on all tables
- Never expose service role keys
- Store secrets in Azure Key Vault, Vercel env, and GitHub Secrets only
- Use Zod validation on all APIs/forms
- Use secure HTTP-only cookies
- Prevent SQL injection, XSS, and CSRF
- Backend-only secret handling

Database Tables:
- profiles
- appointments
- dentists
- services
- schedules
- blocked_dates
- clinic_settings

Google Calendar:
- Auto-create/update/delete calendar events
- Prevent double bookings
- Handle OAuth token refresh securely

Deployment:
- GitHub for version control
- Clean architecture and modular code
- Deploy on Vercel
- Include `.env.example`, README, setup guide, and migration scripts

Code Requirements:
- Strict TypeScript
- Reusable components
- Clean folder structure
- Production-grade code only
- Fast, scalable, and maintainable architecture