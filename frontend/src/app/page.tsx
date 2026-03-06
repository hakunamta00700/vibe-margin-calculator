"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { listPublicRecipes, Recipe } from "@/lib/recipe-api";

type SortOrder = "created_at" | "updated_at" | "title";
type Direction = "asc" | "desc";

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SortOrder>("created_at");
  const [order, setOrder] = useState<Direction>("desc");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listPublicRecipes({
        q: query || undefined,
        category: category || undefined,
        sort,
        order,
        limit: 20,
      });
      setRecipes(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const uniqueCategories = useMemo(() => {
    const values = new Set<string>();
    recipes.forEach((recipe) => {
      if (recipe.category) {
        values.add(recipe.category);
      }
    });
    return Array.from(values).sort();
  }, [recipes]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await load();
  };

  return (
    <section>
      <h1>공개 레시피</h1>
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
          {loading ? "조회 중" : "적용"}
        </button>
      </form>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!loading && recipes.length === 0 && (
        <p>공개 레시피가 없습니다. 로그인 후 직접 레시피를 등록해 보세요.</p>
      )}

      <div>
        {uniqueCategories.length > 0 && (
          <p>카테고리 샘플: {uniqueCategories.join(", ") || "없음"}</p>
        )}
        {recipes.map((recipe) => (
          <article key={recipe.id} className="list-item card">
            <h3>
              <Link href={`/recipes/${recipe.id}`}>{recipe.title}</Link>
            </h3>
            <p>{recipe.description || "설명 없음"}</p>
            <small>
              수정: {new Date(recipe.updated_at).toLocaleString()} / {recipe.category || "카테고리 없음"}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}
