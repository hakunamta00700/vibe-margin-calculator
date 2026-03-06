import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function HomePage() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    const isLoggedIn = Boolean(data.user);

    return (
      <section>
        <h1>요리 레시피 매니저</h1>
        <p>현재 연결된 환경에서 로그인 상태는 {isLoggedIn ? "로그인됨" : "비로그인"}입니다.</p>
        <p>
          <Link href={isLoggedIn ? "/recipes" : "/login"}>{isLoggedIn ? "내 레시피 보기" : "로그인하기"}</Link>
        </p>
      </section>
    );
  } catch (error) {
    return (
      <section>
        <h1>요리 레시피 매니저</h1>
        <p style={{ color: "crimson" }}>{String(error instanceof Error ? error.message : "Supabase 초기화 실패")}</p>
      </section>
    );
  }
}
