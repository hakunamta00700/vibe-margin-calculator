type AppEnv = Record<string, string | undefined>;

function getEnvVar(processEnv: AppEnv, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = processEnv[key];
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function toProjectUrlFromDatabaseUrl(databaseUrl?: string): string | undefined {
  if (!databaseUrl) {
    return undefined;
  }
  try {
    const parsed = new URL(databaseUrl);
    const host = parsed.hostname;
    const normalizedHost = host.replace(/^db\./, "");
    return `https://${normalizedHost}`;
  } catch {
    return undefined;
  }
}

export function resolveSupabaseEnv(processEnv: AppEnv = process.env) {
  const databaseUrl =
    getEnvVar(processEnv, "SUPERBASE_DATABASE_URL", "SUPABASE_DATABASE_URL", "DATABASE_URL");
  const canonicalUrl =
    getEnvVar(processEnv, "SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  const anonymousKey =
    getEnvVar(processEnv, "SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPERBASE_API_KEY", "SUPABASE_PUBLIC_KEY");
  const serviceRoleKey =
    getEnvVar(processEnv, "SUPABASE_SERVICE_ROLE_KEY", "SUPERBASE_SECRET_KEY", "SUPABASE_SECRET_KEY");

  const url = canonicalUrl ?? toProjectUrlFromDatabaseUrl(databaseUrl);
  const hasUrl = Boolean(url);
  const hasAnon = Boolean(anonymousKey);
  const hasService = Boolean(serviceRoleKey);

  if (!hasUrl || !hasAnon) {
    throw new Error(
      "Supabase env not configured. Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or compatible aliases."
    );
  }

  return {
    url,
    databaseUrl,
    anonymousKey: anonymousKey as string,
    serviceRoleKey,
  } as const;
}
