import Link from "next/link";

export const metadata = { title: "Privacy Policy — Smurf Dental Clinic" };

export default function PrivacyPolicyPage() {
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
            Legal · Data Privacy
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.4rem", fontWeight: 600, color: "var(--ink)", lineHeight: 1.1, marginBottom: "0.75rem" }}>
            Privacy Policy
          </h1>
          <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem" }}>
            Effective date: {new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })} · Smurf Dental Clinic, Philippines
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", color: "var(--ink)", lineHeight: 1.75, fontSize: "0.9375rem" }}>

          {/* Notice box */}
          <div style={{ background: "var(--accent-subtle)", border: "1px solid rgba(26,122,94,0.2)", borderRadius: "10px", padding: "1rem 1.25rem" }}>
            <p style={{ color: "var(--accent)", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              RA 10173 — Data Privacy Act of 2012
            </p>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.85rem" }}>
              This policy is issued in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173) and its Implementing Rules and Regulations, as enforced by the National Privacy Commission (NPC) of the Philippines.
            </p>
          </div>

          <Section title="1. Data Controller">
            <p>
              <strong>Smurf Dental Clinic</strong> is the Data Controller responsible for the personal data collected through this website and booking system.
            </p>
            <p style={{ marginTop: "0.5rem" }}>
              <strong>Data Protection Officer (DPO):</strong><br />
              Email: <a href="mailto:privacy@smurfdental.com" style={{ color: "var(--accent)" }}>privacy@smurfdental.com</a><br />
              Address: Smurf Dental Clinic, Philippines
            </p>
          </Section>

          <Section title="2. Personal Data We Collect">
            <p>We collect the following categories of personal data when you register or book an appointment:</p>
            <ul style={{ paddingLeft: "1.25rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <li><strong>Identity data:</strong> full name</li>
              <li><strong>Contact data:</strong> email address, phone number</li>
              <li><strong>Health data (Sensitive Personal Information):</strong> appointment history, dental services availed, appointment notes — classified as Sensitive Personal Information under Section 3(l) of RA 10173</li>
              <li><strong>Technical data:</strong> session tokens, login timestamps</li>
            </ul>
            <p style={{ marginTop: "0.75rem" }}>
              We do not collect payment card details, government IDs, or biometric data.
            </p>
          </Section>

          <Section title="3. Legal Basis and Purpose of Processing">
            <p>We process your personal data on the following legal bases:</p>
            <ul style={{ paddingLeft: "1.25rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <li><strong>Consent</strong> — provided at registration, for marketing and non-essential communications</li>
              <li><strong>Contractual necessity</strong> — to fulfill your appointment booking</li>
              <li><strong>Legitimate interest</strong> — clinic operations, fraud prevention, system security</li>
              <li><strong>Legal obligation</strong> — compliance with health and business regulations</li>
            </ul>
            <p style={{ marginTop: "0.75rem" }}>Purposes include: appointment scheduling, email reminders and confirmations, dental records management, and clinic analytics.</p>
          </Section>

          <Section title="4. Data Retention">
            <p>
              We retain personal data for as long as necessary to fulfill the purposes described above. Appointment and health records are retained for a minimum of <strong>7 years</strong> from the date of last appointment, consistent with standard healthcare record-keeping practices in the Philippines. Account data is deleted upon your request, subject to Section 9 below.
            </p>
          </Section>

          <Section title="5. Third-Party Processors and Cross-Border Transfers">
            <p>We share your data with the following sub-processors. By using this service you acknowledge that your data may be transferred outside the Philippines to servers located in the United States:</p>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.75rem", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
                  {["Processor", "Purpose", "Location"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "var(--ink-muted)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Supabase (AWS)", "Database & authentication", "USA (us-east-1)"],
                  ["Google LLC", "Calendar sync (optional)", "USA"],
                  ["Google Gmail SMTP", "Appointment email notifications", "USA"],
                ].map(([proc, purpose, loc], i) => (
                  <tr key={proc} style={{ borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                    <td style={{ padding: "0.5rem 0.75rem", fontWeight: 500 }}>{proc}</td>
                    <td style={{ padding: "0.5rem 0.75rem", color: "var(--ink-muted)" }}>{purpose}</td>
                    <td style={{ padding: "0.5rem 0.75rem", color: "var(--ink-muted)" }}>{loc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ marginTop: "0.75rem" }}>
              These processors are bound by their own privacy policies and data processing agreements. We do not sell your personal data to any third party.
            </p>
          </Section>

          <Section title="6. Your Rights Under RA 10173">
            <p>As a data subject, you have the following rights:</p>
            <ul style={{ paddingLeft: "1.25rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                ["Right to be informed", "Know what data we collect and how it is used (this policy)."],
                ["Right to access", "Request a copy of your personal data."],
                ["Right to correction", "Request correction of inaccurate data."],
                ["Right to erasure", "Request deletion of your account and personal data (subject to legal retention requirements)."],
                ["Right to data portability", "Receive your data in a structured, machine-readable format."],
                ["Right to object", "Object to processing based on legitimate interest."],
                ["Right to file a complaint", "Lodge a complaint with the National Privacy Commission at www.privacy.gov.ph."],
              ].map(([right, desc]) => (
                <li key={right as string}><strong>{right}:</strong> {desc}</li>
              ))}
            </ul>
            <p style={{ marginTop: "0.75rem" }}>
              To exercise your rights, contact our DPO at <a href="mailto:privacy@smurfdental.com" style={{ color: "var(--accent)" }}>privacy@smurfdental.com</a>. We will respond within 15 business days. You may also delete your account directly from your profile settings.
            </p>
          </Section>

          <Section title="7. Security Measures">
            <p>
              We implement appropriate technical and organizational measures to protect your personal data, including: TLS encryption in transit, AES-256 encryption for sensitive credentials at rest, row-level security on all database tables, role-based access control, HTTP security headers (HSTS, CSP, X-Frame-Options), and rate limiting on authentication endpoints.
            </p>
          </Section>

          <Section title="8. Cookies and Sessions">
            <p>
              We use strictly necessary session cookies for authentication. We do not use advertising, analytics, or tracking cookies. No third-party tracking scripts are loaded on this site.
            </p>
          </Section>

          <Section title="9. Data Breach Notification">
            <p>
              In the event of a personal data breach that is likely to result in harm, we will notify affected data subjects and the National Privacy Commission within 72 hours of discovery, as required under NPC Circular 16-03.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this policy from time to time. The effective date at the top of this page will reflect the latest revision. Continued use of our services after changes constitutes acceptance of the updated policy.
            </p>
          </Section>

          <div style={{ marginTop: "1rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)", fontSize: "0.875rem", color: "var(--ink-muted)" }}>
            <p>Questions? Contact our DPO at <a href="mailto:privacy@smurfdental.com" style={{ color: "var(--accent)" }}>privacy@smurfdental.com</a></p>
            <p style={{ marginTop: "0.5rem" }}>
              <Link href="/terms" style={{ color: "var(--accent)" }}>Terms of Service</Link>
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
