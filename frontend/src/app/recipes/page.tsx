"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderClosedIcon, PlusIcon } from "lucide-react";
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
import { getAuthToken, Recipe, listRecipes } from "@/lib/recipe-api";

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<RecipeSortOrder>("updated_at");
  const [order, setOrder] = useState<RecipeDirection>("desc");

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
      const message =
        (err as { status?: number }).status === 401 ? "로그인이 필요합니다." : (err as Error).message;
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

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadRecipes();
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge variant="secondary" className="w-fit rounded-full px-3">
            Workspace
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">내 레시피 작업실</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              비공개 초안부터 공개 전환할 레시피까지 한 화면에서 정리하고, 수정 흐름을 빠르게 이어갈 수
              있습니다.
            </p>
          </div>
        </div>
        <Button asChild size="lg">
          <Link href="/recipes/new">
            <PlusIcon className="size-4" />
            새 레시피 등록
          </Link>
        </Button>
      </div>

      <Card className="border-white/70 bg-white/82 shadow-lg shadow-orange-950/5 backdrop-blur">
        <CardContent className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">현재 보유 레시피</p>
            <p className="text-4xl font-semibold tracking-tight">{loading ? "--" : recipes.length}</p>
          </div>
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FolderClosedIcon className="size-4" />
              작업 힌트
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              공개 전환 전에는 상세 페이지에서 대표 이미지와 공개 상태를 점검하는 흐름이 가장 빠릅니다.
            </p>
          </div>
        </CardContent>
      </Card>

      <RecipeFilterBar
        title="내 레시피 필터"
        description="작업 중인 초안과 공개 레시피를 상태, 카테고리, 정렬 기준으로 정리합니다."
        query={query}
        category={category}
        sort={sort}
        order={order}
        loading={loading}
        action={
          <Button asChild variant="outline">
            <Link href="/">공개 페이지로 이동</Link>
          </Button>
        }
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
            <h2 className="text-xl font-semibold tracking-tight">아직 저장된 레시피가 없습니다.</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              새 레시피를 등록해 작업실을 시작해 보세요. 공개 전환은 상세 페이지에서 언제든 가능합니다.
            </p>
            <div className="flex justify-center">
              <Button asChild>
                <Link href="/recipes/new">첫 레시피 등록</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} showVisibility actionLabel="관리하기" />
          ))}
        </div>
      )}
    </section>
  );
}
