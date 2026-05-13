import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex" style={{ background: "var(--bg)" }}>

      {/* Left — decorative panel */}
      <div
        className="hidden lg:flex w-[42%] flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: "var(--sidebar-bg)" }}
      >
        <div className="absolute -bottom-40 -left-40 w-[560px] h-[560px] rounded-full" style={{ border: "70px solid rgba(255,255,255,0.025)" }} />
        <div className="absolute top-10 -right-28 w-80 h-80 rounded-full" style={{ border: "50px solid rgba(255,255,255,0.02)" }} />

        <div className="flex items-center gap-3">
          <svg width="20" height="24" viewBox="0 0 60 72" fill="none">
            <path d="M10 22C10 11 18 4 30 4C42 4 50 11 50 22V42C50 54 43 60 36 63L33 68C31.5 71.5 28.5 71.5 27 68L24 63C17 60 10 54 10 42V22Z" stroke="#6EE7B7" strokeWidth="3" strokeLinejoin="round"/>
            <path d="M20 22C20 16 24.5 13 30 13C35.5 13 40 16 40 22" stroke="#6EE7B7" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M24 63L21 70M36 63L39 70" stroke="#6EE7B7" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span className="font-display text-white font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>
            Smurf Dental
          </span>
        </div>

        <div>
          <h2
            className="font-display text-white leading-tight mb-4"
            style={{ fontFamily: "var(--font-display)", fontSize: "2.8rem", fontWeight: 400 }}
          >
            Set a new<br /><em style={{ color: "#6EE7B7" }}>password.</em>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: "280px" }}>
            Choose a strong password to secure your account.
          </p>
        </div>

        <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          RA 10173 Compliant · Secure & Private
        </p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px] animate-fade-up">

          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <svg width="18" height="22" viewBox="0 0 60 72" fill="none">
              <path d="M10 22C10 11 18 4 30 4C42 4 50 11 50 22V42C50 54 43 60 36 63L33 68C31.5 71.5 28.5 71.5 27 68L24 63C17 60 10 54 10 42V22Z" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round"/>
            </svg>
            <span className="font-display font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}>
              Smurf Dental
            </span>
          </div>

          <h1
            className="font-display mb-1"
            style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "var(--ink)" }}
          >
            New password
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--ink-muted)" }}>
            Enter and confirm your new password
          </p>

          <div
            className="rounded-2xl p-7"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
          >
            <ResetPasswordForm />
          </div>
        </div>
      </div>
    </main>
  );
}
