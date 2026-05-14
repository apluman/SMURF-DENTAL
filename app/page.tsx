import Link from "next/link";
import ChatWidget from "@/components/chat/ChatWidget";

function ToothIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 60 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 22C10 11 18 4 30 4C42 4 50 11 50 22V42C50 54 43 60 36 63L33 68C31.5 71.5 28.5 71.5 27 68L24 63C17 60 10 54 10 42V22Z"
        stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"
      />
      <path d="M20 22C20 16 24.5 13 30 13C35.5 13 40 16 40 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M24 63L21 70" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M36 63L39 70" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col lg:flex-row" style={{ background: "var(--bg)" }}>

      {/* Left panel — dark, full width on mobile */}
      <div
        className="relative w-full lg:w-[46%] min-h-screen flex flex-col justify-between py-12 px-8 lg:py-10 lg:px-14 overflow-hidden"
        style={{ background: "var(--sidebar-bg)" }}
      >
        {/* Decorative rings */}
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.04]" style={{ border: "60px solid white" }} />
        <div className="absolute top-20 -right-24 w-72 h-72 rounded-full opacity-[0.03]" style={{ border: "40px solid white" }} />

        {/* Logo */}
        <div className="animate-fade-up flex items-center gap-3">
          <ToothIcon className="w-7 h-7 text-emerald-400" />
          <span className="font-display text-white text-xl font-semibold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            Smurf Dental
          </span>
        </div>

        {/* Hero text */}
        <div className="space-y-8 py-12 lg:py-0">
          <div className="animate-fade-up delay-100">
            <p className="text-emerald-400 text-sm font-medium tracking-widest uppercase mb-5">
              Dental Clinic · Philippines
            </p>
            <h1
              className="font-display text-white leading-[1.1] mb-6"
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.6rem, 8vw, 4rem)", fontWeight: 400 }}
            >
              Expert care,<br />
              <em style={{ color: "#6EE7B7", fontStyle: "italic" }}>crafted for</em><br />
              your smile.
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: "340px", fontSize: "1rem" }}>
              Book appointments with our trusted specialists in minutes. Professional dental care, now at your fingertips.
            </p>
          </div>

          {/* CTAs */}
          <div className="animate-fade-up delay-200 flex flex-col gap-3 w-full max-w-[320px]">
            <Link
              href="/patient/book"
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium text-sm transition-all duration-200 active:scale-[0.98]"
              style={{ background: "var(--accent)", color: "white" }}
            >
              Book an Appointment
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center px-6 py-4 rounded-xl font-medium text-sm transition-all duration-200"
              style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.8)" }}
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>

        {/* Bottom note */}
        <div className="animate-fade-up delay-300">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            RA 10173 Compliant · Secure Booking · Trusted by Families
          </p>
          <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.18)" }}>
            <Link href="/privacy" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Privacy Policy</Link>
            {" · "}
            <Link href="/terms" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Terms of Service</Link>
          </p>
        </div>
      </div>

      {/* Right panel — decorative, hidden on mobile */}
      <div className="hidden lg:flex flex-1 relative flex-col items-center justify-center overflow-hidden" style={{ background: "var(--bg)" }}>

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: "radial-gradient(circle, #C8B89A 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Center composition */}
        <div className="relative z-10 flex flex-col items-center">

          {/* Slowly rotating outer dashed ring */}
          <div
            className="absolute animate-spin-slow rounded-full"
            style={{ width: "520px", height: "520px", border: "1px dashed rgba(26,122,94,0.14)" }}
          />
          {/* Outer pulse ring */}
          <div
            className="animate-pulse-ring absolute rounded-full"
            style={{ width: "450px", height: "450px", border: "1px solid rgba(26,122,94,0.13)" }}
          />
          {/* Mid pulse ring */}
          <div
            className="animate-pulse-ring delay-300 absolute rounded-full"
            style={{ width: "368px", height: "368px", border: "1px solid rgba(26,122,94,0.09)" }}
          />

          {/* Main glass circle */}
          <div
            className="relative w-80 h-80 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(234,244,239,0.72) 100%)",
              border: "1px solid rgba(26,122,94,0.18)",
              boxShadow: "0 16px 56px rgba(26,122,94,0.10), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)",
              backdropFilter: "blur(14px)",
            }}
          >
            {/* Inner circle */}
            <div
              className="w-52 h-52 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(145deg, #ffffff 0%, rgba(234,244,239,0.55) 100%)",
                border: "1px solid rgba(26,122,94,0.11)",
                boxShadow: "inset 0 2px 14px rgba(26,122,94,0.07), 0 0 0 7px rgba(255,255,255,0.45)",
              }}
            >
              <ToothIcon
                className="w-24 h-24 animate-float"
                style={{ color: "var(--accent)", filter: "drop-shadow(0 6px 18px rgba(26,122,94,0.28))" } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Promo pills */}
          <div className="animate-fade-up delay-400 flex gap-3 mt-12 flex-wrap justify-center">
            {[
              {
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                ),
                label: "Free Consultation",
                sub: "First visit",
              },
              {
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                ),
                label: "Same-Day Booking",
                sub: "Available daily",
              },
              {
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                ),
                label: "500+ Patients",
                sub: "and growing",
              },
            ].map(({ icon, label, sub }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 px-4 py-2.5"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "100px",
                  boxShadow: "var(--shadow)",
                }}
              >
                <span
                  className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0"
                  style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
                >
                  {icon}
                </span>
                <span>
                  <span className="block text-xs font-semibold leading-tight" style={{ color: "var(--ink)" }}>{label}</span>
                  <span className="block text-[10px] leading-tight" style={{ color: "var(--ink-muted)" }}>{sub}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ChatWidget />
    </main>
  );
}
