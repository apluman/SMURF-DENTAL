"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie_consent")) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  }

  function dismiss() {
    localStorage.setItem("cookie_consent", "dismissed");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))", left: "50%", transform: "translateX(-50%)",
      zIndex: 99999, width: "calc(100% - 2rem)", maxWidth: "720px",
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "14px", boxShadow: "var(--shadow-md)",
      padding: "1rem 1.25rem",
      display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.75rem",
    }}>
      {/* Cookie icon */}
      <div style={{
        width: "36px", height: "36px", borderRadius: "10px",
        background: "var(--accent-subtle)", display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
          <path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01"/>
        </svg>
      </div>

      {/* Text */}
      <p style={{ flex: 1, minWidth: "180px", fontSize: "0.8125rem", margin: 0, color: "var(--ink-muted)", lineHeight: 1.5 }}>
        We use cookies to give you the best experience on our site. By continuing, you agree to our{" "}
        <Link href="/privacy" style={{ color: "var(--accent)", textDecoration: "underline", fontWeight: 500 }}>
          Privacy Policy
        </Link>
        .
      </p>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
        <Link
          href="/privacy"
          style={{
            padding: "0.4rem 1rem", borderRadius: "8px",
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--ink-muted)", fontSize: "0.8125rem", fontWeight: 500,
            textDecoration: "none", whiteSpace: "nowrap",
          }}
        >
          Learn more
        </Link>
        <button
          onClick={accept}
          style={{
            padding: "0.4rem 1.25rem", borderRadius: "8px",
            background: "var(--accent)", color: "white",
            border: "none", fontSize: "0.8125rem", fontWeight: 600,
            cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          Accept
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          style={{
            background: "none", border: "none", color: "var(--ink-muted)",
            cursor: "pointer", padding: "4px", lineHeight: 1, display: "flex",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
