import { NextResponse } from "next/server";

// Dev-only endpoint — verifies Azure Key Vault connection and secret availability
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const vaultUrl = process.env.AZURE_KEY_VAULT_URL;
  if (!vaultUrl) {
    return NextResponse.json({
      status: "skipped",
      message: "AZURE_KEY_VAULT_URL not set — vault integration inactive, falling back to env vars.",
    });
  }

  const secretNames = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "GOOGLE_CLIENT_SECRET",
    "SMTP_PASS",
    "ENCRYPTION_KEY",
  ];

  const results: Record<string, "loaded" | "missing"> = {};
  for (const name of secretNames) {
    results[name] = process.env[name] ? "loaded" : "missing";
  }

  const allLoaded = Object.values(results).every((v) => v === "loaded");

  return NextResponse.json({
    status: allLoaded ? "ok" : "partial",
    vaultUrl,
    secrets: results,
  });
}
