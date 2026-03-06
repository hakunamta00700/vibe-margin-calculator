"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getAuthToken, Recipe, listRecipes } from "@/lib/recipe-api";
import { useRouter } from "next/navigation";

type SortOrder = "created_at" | "updated_at" | "title";
type Direction = "asc" | "desc";

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SortOrder>("updated_at");
  const [order, setOrder] = useState<Direction>("desc");

  const loadRecipes = async () => {
    if (!getAuthToken()) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await listRecipes({
        q: query || undefined,
        category: category || undefined,
        sort,
        order,
        open: false,
      });
      setRecipes(data);
    } catch (err) {
      const message = (err as { status?: number }).status === 401 ? "로그인이 필요합니다." : (err as Error).message;
      setError(message);
      if ((err as { status?: number }).status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecipes();
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await loadRecipes();
  };

  return (
    <section>
      <h1>내 레시피</h1>
      <div className="card toolbar">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <p style={{ margin: 0 }}>
            <Link href="/recipes/new">새 레시피 등록</Link>
          </p>
          <Link href="/">공개 페이지로</Link>
        </div>
      </div>
      <form className="card toolbar" onSubmit={onSubmit}>
        <label>
          키워드
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          카테고리
          <input value={category} onChange={(event) => setCategory(event.target.value)} />
        </label>
        <label>
          정렬
          <select value={sort} onChange={(event) => setSort(event.target.value as SortOrder)}>
            <option value="created_at">최신 등록순</option>
            <option value="updated_at">최근 수정순</option>
            <option value="title">이름순</option>
          </select>
        </label>
        <label>
          방향
          <select value={order} onChange={(event) => setOrder(event.target.value as Direction)}>
            <option value="desc">내림차순</option>
            <option value="asc">오름차순</option>
          </select>
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "조회 중" : "조회"}
        </button>
      </form>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {(!loading && recipes.length === 0) && <p>레시피가 없습니다.</p>}
      {recipes.map((recipe) => (
        <article key={recipe.id} className="card list-item">
          <h3>
            <Link href={`/recipes/${recipe.id}`}>{recipe.title}</Link>
          </h3>
          <p>{recipe.description || "설명 없음"}</p>
          <p>
            {recipe.is_public ? "공개" : "비공개"} | 카테고리: {recipe.category || "미지정"}
          </p>
          <small>수정일: {new Date(recipe.updated_at).toLocaleString()}</small>
        </article>
      ))}
    </section>
  );
}
