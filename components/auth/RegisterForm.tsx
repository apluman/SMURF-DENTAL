"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RegisterForm() {
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [verified, setVerified] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", email: "", phone: "", password: "", confirm_password: "" },
  });

  async function onSubmit(data: RegisterInput) {
    if (!consent) {
      setConsentError(true);
      return;
    }
    setConsentError(false);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/patient/dashboard`;

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name, phone: data.phone, role: "patient" },
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      form.setError("root", { message: error.message });
      return;
    }

    setRegisteredEmail(data.email);
    setVerified(true);
  }

  if (verified) {
    return (
      <div style={{ textAlign: "center", padding: "1rem 0" }}>
        <div style={{
          width: "52px", height: "52px", borderRadius: "50%",
          background: "rgba(16,185,129,0.12)", display: "flex",
          alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.5rem" }}>
          Check your email
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)", lineHeight: 1.6, marginBottom: "0.25rem" }}>
          We sent a verification link to
        </p>
        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--accent)", marginBottom: "1.25rem" }}>
          {registeredEmail}
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)", lineHeight: 1.6 }}>
          Click the link in the email to activate your account. Check your spam folder if you don&apos;t see it.
        </p>
        <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)" }}>
            Already verified?{" "}
            <Link href="/login" style={{ color: "var(--accent)", fontWeight: 500 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const fields: { name: keyof RegisterInput; label: string; type: string; placeholder: string }[] = [
    { name: "full_name", label: "Full Name", type: "text", placeholder: "Juan Dela Cruz" },
    { name: "email", label: "Email", type: "email", placeholder: "you@example.com" },
    { name: "phone", label: "Phone", type: "tel", placeholder: "09171234567" },
    { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
    { name: "confirm_password", label: "Confirm Password", type: "password", placeholder: "••••••••" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {fields.map((f) => (
          <FormField
            key={f.name}
            control={form.control}
            name={f.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{f.label}</FormLabel>
                <FormControl>
                  <Input type={f.type} placeholder={f.placeholder} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        {/* RA 10173 consent */}
        <div style={{ paddingTop: "0.25rem" }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => { setConsent(e.target.checked); if (e.target.checked) setConsentError(false); }}
              style={{ marginTop: "3px", accentColor: "var(--accent)", width: "15px", height: "15px", flexShrink: 0, cursor: "pointer" }}
            />
            <span style={{ fontSize: "0.8125rem", color: "var(--ink-muted)", lineHeight: 1.5 }}>
              I have read and agree to the{" "}
              <Link href="/privacy" target="_blank" style={{ color: "var(--accent)", fontWeight: 500 }}>Privacy Policy</Link>
              {" "}and{" "}
              <Link href="/terms" target="_blank" style={{ color: "var(--accent)", fontWeight: 500 }}>Terms of Service</Link>
              . I consent to the collection and processing of my personal data for appointment booking purposes, in accordance with RA 10173.
            </span>
          </label>
          {consentError && (
            <p style={{ color: "#DC2626", fontSize: "0.75rem", marginTop: "6px", marginLeft: "25px" }}>
              You must agree to the Privacy Policy and Terms of Service to register.
            </p>
          )}
        </div>

        {form.formState.errors.root && (
          <p style={{ color: "#DC2626", fontSize: "0.875rem" }}>
            {form.formState.errors.root.message}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating account..." : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}
