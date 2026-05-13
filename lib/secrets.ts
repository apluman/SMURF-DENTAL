import { SecretClient } from "@azure/keyvault-secrets";
import { ClientSecretCredential } from "@azure/identity";

// Azure KV secret name → process.env key
const SECRET_MAP: Record<string, string> = {
  "SUPABASE-SERVICE-ROLE-KEY":  "SUPABASE_SERVICE_ROLE_KEY",
  "GOOGLE-CLIENT-SECRET":       "GOOGLE_CLIENT_SECRET",
  "SMTP-PASS":                  "SMTP_PASS",
  "ENCRYPTION-KEY":             "ENCRYPTION_KEY",
  "UPSTASH-REDIS-REST-TOKEN":   "UPSTASH_REDIS_REST_TOKEN",
};

let loaded = false;

export async function loadSecretsFromVault(): Promise<void> {
  if (loaded) return;
  loaded = true; // mark early so a crash doesn't leave the app in a retry loop

  const vaultUrl     = process.env.AZURE_KEY_VAULT_URL;
  const tenantId     = process.env.AZURE_TENANT_ID;
  const clientId     = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!vaultUrl || !tenantId || !clientId || !clientSecret) {
    console.warn("[Azure KV] Missing config — falling back to Vercel env vars.");
    return;
  }

  try {
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret, {
      additionallyAllowedTenants: ["*"],
    });
    const client = new SecretClient(vaultUrl, credential);

    await Promise.all(
      Object.entries(SECRET_MAP).map(async ([kvName, envName]) => {
        try {
          const secret = await client.getSecret(kvName);
          if (secret.value) process.env[envName] = secret.value;
        } catch (err) {
          console.warn(`[Azure KV] Could not fetch "${kvName}" — using env var fallback.`, err);
        }
      })
    );

    console.log("[Azure KV] Secrets loaded successfully.");
  } catch (err) {
    console.error("[Azure KV] Auth failed — falling back to Vercel env vars.", err);
  }
}
