"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordAction } from "@/app/actions/auth";

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

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await resetPasswordAction(password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <label style={labelStyle}>New password</label>
        <input
          type="password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>Confirm password</label>
        <input
          type="password"
          required
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Repeat new password"
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
        disabled={loading || !password || !confirm}
        style={{
          width: "100%",
          padding: "0.75rem",
          borderRadius: "10px",
          background: "var(--accent)",
          color: "white",
          fontWeight: 600,
          fontSize: "0.875rem",
          border: "none",
          cursor: loading || !password || !confirm ? "not-allowed" : "pointer",
          opacity: loading || !password || !confirm ? 0.6 : 1,
        }}
      >
        {loading ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}
