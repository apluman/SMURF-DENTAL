"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

export default function RegisterForm() {
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);

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
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name, phone: data.phone, role: "patient" },
      },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created! Redirecting...");
    router.push("/dashboard");
    router.refresh();
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

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating account..." : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}
