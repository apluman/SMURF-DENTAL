"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { deleteAccountAction } from "@/app/actions/account";
import type { Profile } from "@/types";

export default function ProfileForm({ profile }: { profile: Profile | null }) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("id", profile!.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile updated.");
    }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteAccountAction();
    if (result?.error) {
      toast.error(result.error);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
    // On success, server action redirects to "/"
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Full Name</Label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={profile?.email ?? ""} disabled className="bg-muted text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09171234567" />
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save Changes"}
      </Button>

      {/* Danger zone */}
      <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#DC2626", marginBottom: "0.5rem" }}>
          Danger Zone
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)", marginBottom: "1rem", lineHeight: 1.5 }}>
          Deleting your account permanently removes all your personal data and appointment history from our system, in accordance with your right to erasure under RA 10173. This action cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#DC2626", background: "transparent", border: "1px solid #FECACA", borderRadius: "8px", padding: "0.5rem 1rem", cursor: "pointer", transition: "background 0.15s" }}
          >
            Delete My Account
          </button>
        ) : (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "1rem" }}>
            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#991B1B", marginBottom: "0.75rem" }}>
              Are you sure? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ fontSize: "0.8125rem", fontWeight: 600, color: "white", background: "#DC2626", border: "none", borderRadius: "8px", padding: "0.5rem 1rem", cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? "Deleting..." : "Yes, delete permanently"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--ink-muted)", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.5rem 1rem", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
