"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/app/actions/auth";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.875rem",
  borderRadius: "10px",
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--ink)",
  fontSize: "0.875rem",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--ink-muted)",
  marginBottom: "0.375rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await forgotPasswordAction(email);
    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div style={{ textAlign: "center", padding: "1rem 0" }}>
        <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <p style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "0.5rem" }}>Check your email</p>
        <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)", marginBottom: "1.5rem" }}>
          We sent a password reset link to <strong style={{ color: "var(--ink)" }}>{email}</strong>
        </p>
        <Link href="/login" style={{ fontSize: "0.875rem", color: "var(--accent)", fontWeight: 600 }}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <label style={labelStyle}>Email address</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={inputStyle}
        />
      </div>

      {error && (
        <p style={{ fontSize: "0.8125rem", color: "#DC2626", background: "#FEF2F2", padding: "0.625rem 0.875rem", borderRadius: "8px" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !email}
        style={{
          width: "100%",
          padding: "0.75rem",
          borderRadius: "10px",
          background: "var(--accent)",
          color: "white",
          fontWeight: 600,
          fontSize: "0.875rem",
          border: "none",
          cursor: loading || !email ? "not-allowed" : "pointer",
          opacity: loading || !email ? 0.6 : 1,
        }}
      >
        {loading ? "Sending…" : "Send reset link"}
      </button>

      <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--ink-muted)" }}>
        <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>Back to sign in</Link>
      </p>
    </form>
  );
}
