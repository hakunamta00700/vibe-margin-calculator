"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { FolderKanbanIcon, SparklesIcon } from "lucide-react";
import { RecipeCard } from "@/components/recipe-card";
import {
  RecipeDirection,
  RecipeFilterBar,
  RecipeSortOrder,
} from "@/components/recipe-filter-bar";
import { StatusBanner } from "@/components/status-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listPublicRecipes, Recipe } from "@/lib/recipe-api";


export function PublicRecipeBrowser() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<RecipeSortOrder>("created_at");
  const [order, setOrder] = useState<RecipeDirection>("desc");

  const uniqueCategories = Array.from(
    new Set(recipes.map((recipe) => recipe.category).filter((value): value is string => Boolean(value))),
  ).sort();

  const load = async (nextQuery = query, nextCategory = category): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      const data = await listPublicRecipes({
        q: nextQuery || undefined,
        category: nextCategory || undefined,
        sort,
        order,
        limit: 20,
      });
      setRecipes(data);
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load("", "");
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    await load();
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-white/70 bg-white/82 shadow-lg shadow-orange-950/5 backdrop-blur">
          <CardContent className="space-y-3 px-6 py-5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <SparklesIcon className="size-4" />
              공개 레시피 수
            </div>
            <p className="text-4xl font-semibold tracking-tight">{loading ? "--" : recipes.length}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              필터 조건에 맞는 공개 레시피 개수입니다.
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/70 bg-white/82 shadow-lg shadow-orange-950/5 backdrop-blur">
          <CardContent className="space-y-3 px-6 py-5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-900">
              <FolderKanbanIcon className="size-4" />
              카테고리
            </div>
            <p className="text-4xl font-semibold tracking-tight">
              {loading ? "--" : uniqueCategories.length}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {uniqueCategories.length > 0
                ? uniqueCategories.slice(0, 4).join(", ")
                : "아직 등록된 공개 카테고리가 없습니다."}
            </p>
          </CardContent>
        </Card>
      </div>

      <RecipeFilterBar
        title="공개 레시피 탐색"
        description="검색어와 정렬 기준을 조합해 참고할 레시피만 빠르게 추려보세요."
        query={query}
        category={category}
        sort={sort}
        order={order}
        loading={loading}
        onSubmit={onSubmit}
        onQueryChange={setQuery}
        onCategoryChange={setCategory}
        onSortChange={setSort}
        onOrderChange={setOrder}
      />

      <StatusBanner message={error} tone="error" />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card
              key={index}
              className="border-white/70 bg-white/70 shadow-lg shadow-orange-950/5 backdrop-blur"
            >
              <CardContent className="space-y-4 px-6 py-6">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-10 w-full rounded-2xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <Card className="border-dashed border-orange-200 bg-white/70 shadow-lg shadow-orange-950/5">
          <CardContent className="space-y-3 px-6 py-8 text-center">
            <Badge variant="secondary" className="rounded-full px-3">
              Archive Empty
            </Badge>
            <h2 className="text-xl font-semibold tracking-tight">조건에 맞는 공개 레시피가 없습니다.</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              검색어를 비우거나 카테고리를 바꿔 다시 조회해 보세요. 직접 레시피를 등록해도 됩니다.
            </p>
            <div className="flex justify-center">
              <Button asChild variant="outline">
                <Link href="/recipes/new">새 레시피 작성</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </section>
  );
}
