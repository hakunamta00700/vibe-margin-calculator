import { createBrowserClient } from "@supabase/ssr";
import { resolveSupabaseEnv } from "./env";

export function createBrowserSupabaseClient() {
  const { url, anonymousKey } = resolveSupabaseEnv();
  return createBrowserClient(url, anonymousKey);
}
