import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { resolveSupabaseEnv } from "./env";

export async function createServerSupabaseClient() {
  const { url, anonymousKey } = resolveSupabaseEnv();
  const cookieStore = cookies();

  return createServerClient(url, anonymousKey, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // Edge 환경이나 읽기 전용 응답에서는 set이 실패할 수 있어 무시
        }
      },
      remove: (name, options) => {
        try {
          cookieStore.set(name, "", { ...options, expires: new Date(0) });
        } catch {
          // Same as above
        }
      },
    },
  });
}
