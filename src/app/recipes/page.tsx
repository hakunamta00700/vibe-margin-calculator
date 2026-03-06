import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function RecipesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("recipes")
    .select("id, title, is_public, updated_at")
    .eq("user_id", authData.user.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    return <p>{error.message}</p>;
  }

  return (
    <section>
      <h1>내 레시피</h1>
      <p>
        <Link href="/recipes/new">새 레시피 등록</Link>
      </p>
      {(!data || data.length === 0) && <p>아직 저장된 레시피가 없습니다.</p>}
      <ul>
        {data?.map((recipe) => (
          <li key={recipe.id}>
            {recipe.title} ({recipe.is_public ? "공개" : "비공개"})
          </li>
        ))}
      </ul>
    </section>
  );
}
