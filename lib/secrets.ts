import { SecretClient } from "@azure/keyvault-secrets";
import { ClientSecretCredential } from "@azure/identity";

// Azure KV secret name → process.env key
const SECRET_MAP: Record<string, string> = {
  "SUPABASE-SERVICE-ROLE-KEY": "SUPABASE_SERVICE_ROLE_KEY",
  "GOOGLE-CLIENT-SECRET":      "GOOGLE_CLIENT_SECRET",
  "SMTP-PASS":                 "SMTP_PASS",
  "ENCRYPTION-KEY":            "ENCRYPTION_KEY",
};

let loaded = false;

export async function loadSecretsFromVault(): Promise<void> {
  if (loaded) return;

  const vaultUrl = process.env.AZURE_KEY_VAULT_URL;
  if (!vaultUrl) {
    // No KV configured — fall back to Vercel env vars silently
    loaded = true;
    return;
  }

  const tenantId     = process.env.AZURE_TENANT_ID;
  const clientId     = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    console.warn("[Azure KV] Missing AZURE_TENANT_ID, AZURE_CLIENT_ID, or AZURE_CLIENT_SECRET — skipping vault load.");
    loaded = true;
    return;
  }

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const client = new SecretClient(vaultUrl, credential);

  await Promise.all(
    Object.entries(SECRET_MAP).map(async ([kvName, envName]) => {
      try {
        const secret = await client.getSecret(kvName);
        if (secret.value) process.env[envName] = secret.value;
      } catch (err) {
        console.warn(`[Azure KV] Could not fetch secret "${kvName}" — falling back to env var.`, err);
      }
    })
  );

  loaded = true;
  console.log("[Azure KV] Secrets loaded successfully.");
}
