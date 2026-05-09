import Link from "next/link";

export const metadata = { title: "Terms of Service — Smurf Dental Clinic" };

export default function TermsPage() {
  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div style={{ maxWidth: "740px", margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <Link
            href="/"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--ink-muted)", fontSize: "0.875rem", textDecoration: "none", marginBottom: "2rem" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to home
          </Link>
          <p style={{ color: "var(--accent)", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Legal · Terms
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.4rem", fontWeight: 600, color: "var(--ink)", lineHeight: 1.1, marginBottom: "0.75rem" }}>
            Terms of Service
          </h1>
          <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem" }}>
            Effective date: {new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })} · Smurf Dental Clinic, Philippines
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", color: "var(--ink)", lineHeight: 1.75, fontSize: "0.9375rem" }}>

          <Section title="1. Acceptance of Terms">
            <p>
              By registering for an account or booking an appointment through this website, you agree to be bound by these Terms of Service and our <Link href="/privacy" style={{ color: "var(--accent)" }}>Privacy Policy</Link>. If you do not agree, do not use this service. These terms are governed by the laws of the Republic of the Philippines, including Republic Act No. 8792 (Electronic Commerce Act of 2000).
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              Smurf Dental Clinic provides an online appointment booking and patient management system. The service allows patients to:
            </p>
            <ul style={{ paddingLeft: "1.25rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <li>Register a patient account</li>
              <li>Browse available dentists and dental services</li>
              <li>Book, view, and manage appointments online</li>
              <li>Receive appointment confirmations and reminders via email</li>
            </ul>
            <p style={{ marginTop: "0.75rem" }}>
              This platform is a booking tool only. It does not constitute a medical or dental consultation. No clinical advice, diagnosis, or treatment is provided through this website.
            </p>
          </Section>

          <Section title="3. Eligibility">
            <p>
              You must be at least 18 years old to create an account. If you are booking on behalf of a minor, a parent or legal guardian must create and maintain the account. By registering, you represent that the information you provide is accurate and complete.
            </p>
          </Section>

          <Section title="4. Appointments and Cancellations">
            <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <li>All bookings are subject to confirmation by the clinic. A booking request does not guarantee an appointment until confirmed.</li>
              <li>You may cancel a pending appointment through your patient dashboard.</li>
              <li>For confirmed appointments, please contact the clinic directly to reschedule or cancel.</li>
              <li>Repeated no-shows may result in account suspension at the clinic&apos;s discretion.</li>
            </ul>
          </Section>

          <Section title="5. User Responsibilities">
            <p>You agree to:</p>
            <ul style={{ paddingLeft: "1.25rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <li>Provide accurate, complete, and current registration and health information</li>
              <li>Keep your account credentials confidential</li>
              <li>Notify us immediately of any unauthorized access to your account</li>
              <li>Not use the service for any unlawful purpose or in violation of these terms</li>
              <li>Not attempt to disrupt, hack, or gain unauthorized access to the system</li>
            </ul>
          </Section>

          <Section title="6. Clinic Responsibilities">
            <p>Smurf Dental Clinic will:</p>
            <ul style={{ paddingLeft: "1.25rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <li>Make reasonable efforts to confirm and honor booked appointments</li>
              <li>Notify patients of cancellations or schedule changes in a timely manner</li>
              <li>Protect patient data in accordance with RA 10173 and our Privacy Policy</li>
              <li>Provide services through licensed dental professionals regulated by the Professional Regulation Commission (PRC) of the Philippines</li>
            </ul>
          </Section>

          <Section title="7. Fees and Payments">
            <p>
              Service prices are displayed during the booking process and are subject to change without prior notice. Payment for dental services is collected at the clinic at the time of your appointment. This booking system does not process payments online.
            </p>
          </Section>

          <Section title="8. Intellectual Property">
            <p>
              All content on this platform — including text, graphics, logos, and software — is the property of Smurf Dental Clinic and is protected under applicable Philippine intellectual property laws. You may not reproduce, distribute, or create derivative works without written permission.
            </p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>
              To the maximum extent permitted by Philippine law, Smurf Dental Clinic shall not be liable for any indirect, incidental, or consequential damages arising from your use of this service, including but not limited to missed appointments due to technical errors, loss of data, or service interruptions. Our total liability shall not exceed the amount paid (if any) for the specific service giving rise to the claim.
            </p>
          </Section>

          <Section title="10. Account Termination">
            <p>
              You may delete your account at any time from your profile settings. We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or abuse the booking system. Upon termination, your right to use the service ceases immediately. Appointment and health records are retained as required by law (see our Privacy Policy).
            </p>
          </Section>

          <Section title="11. Governing Law and Dispute Resolution">
            <p>
              These Terms are governed by and construed in accordance with the laws of the Republic of the Philippines. Any dispute arising from these terms shall be subject to the exclusive jurisdiction of the appropriate courts of the Philippines. We encourage good-faith resolution before initiating formal proceedings.
            </p>
          </Section>

          <Section title="12. Changes to These Terms">
            <p>
              We may revise these Terms at any time. The effective date will be updated accordingly. Continued use of the service after changes are posted constitutes your acceptance of the revised terms. We will notify registered users of material changes via email.
            </p>
          </Section>

          <div style={{ marginTop: "1rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)", fontSize: "0.875rem", color: "var(--ink-muted)" }}>
            <p>Questions? Contact us at <a href="mailto:privacy@smurfdental.com" style={{ color: "var(--accent)" }}>privacy@smurfdental.com</a></p>
            <p style={{ marginTop: "0.5rem" }}>
              <Link href="/privacy" style={{ color: "var(--accent)" }}>Privacy Policy</Link>
              {" · "}
              <Link href="/" style={{ color: "var(--accent)" }}>Back to Home</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.6rem" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
