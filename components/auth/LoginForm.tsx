"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction, resendVerificationAction } from "@/app/actions/auth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function LoginForm() {
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginInput) {
    const result = await loginAction(data.email, data.password);
    if (!result) return;
    if ("emailNotVerified" in result && result.emailNotVerified) {
      setUnverifiedEmail(result.email as string);
      return;
    }
    if (result.error) toast.error(result.error);
  }

  async function handleResend() {
    if (!unverifiedEmail || resending) return;
    setResending(true);
    const result = await resendVerificationAction(unverifiedEmail);
    setResending(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      setResent(true);
    }
  }

  if (unverifiedEmail) {
    return (
      <div style={{ textAlign: "center", padding: "1rem 0" }}>
        <div style={{
          width: "52px", height: "52px", borderRadius: "50%",
          background: "rgba(245,158,11,0.12)", display: "flex",
          alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>

        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.5rem" }}>
          Email not verified
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)", lineHeight: 1.6, marginBottom: "0.25rem" }}>
          Please verify your email before signing in.
        </p>
        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--accent)", marginBottom: "1.25rem" }}>
          {unverifiedEmail}
        </p>

        {resent ? (
          <p style={{ fontSize: "0.875rem", color: "#10B981", marginBottom: "1.25rem" }}>
            Verification email sent — check your inbox.
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              width: "100%", padding: "0.625rem 1rem",
              background: "var(--accent)", color: "#fff",
              border: "none", borderRadius: "0.5rem",
              fontSize: "0.875rem", fontWeight: 500,
              cursor: resending ? "not-allowed" : "pointer",
              opacity: resending ? 0.7 : 1,
              marginBottom: "0.75rem",
            }}
          >
            {resending ? "Sending…" : "Resend verification email"}
          </button>
        )}

        <div style={{ paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={() => { setUnverifiedEmail(null); setResent(false); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "0.8125rem", color: "var(--ink-muted)",
            }}
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </Form>
  );
}
