"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RecipeForm } from "@/components/recipe-form";
import { StatusBanner } from "@/components/status-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUserIdFromToken, getRecipe, Recipe, updateRecipe } from "@/lib/recipe-api";
import {
  EMPTY_RECIPE_FORM_VALUES,
  joinTextItems,
  RecipeFormValues,
  splitTextItems,
  tagsFromText,
} from "@/lib/recipe-form";

export default function EditRecipePage() {
  const params = useParams<{ id: string }>();
  const recipeId = Number(params.id);
  const router = useRouter();
  const ownerId = getCurrentUserIdFromToken();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [values, setValues] = useState<RecipeFormValues>(EMPTY_RECIPE_FORM_VALUES);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getRecipe(recipeId);
        if (!data || ownerId === null || String(data.user_id) !== ownerId) {
          router.push("/recipes");
          return;
        }

        setRecipe(data);
        setValues({
          title: data.title,
          description: data.description || "",
          ingredients: joinTextItems(data.ingredients),
          steps: joinTextItems(data.steps),
          prepTime: data.prep_time_min ? String(data.prep_time_min) : "",
          cookTime: data.cook_time_min ? String(data.cook_time_min) : "",
          servings: data.servings ? String(data.servings) : "",
          category: data.category || "",
          tags: data.tags.join(", "),
          isPublic: data.is_public,
        });
      } catch (error) {
        setMessage((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [recipeId, ownerId, router]);

  const updateField = (field: keyof RecipeFormValues, value: string | boolean) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!recipe) {
      return;
    }
    setSubmitting(true);
    setMessage("");

    const nextIngredients = splitTextItems(values.ingredients);
    const nextSteps = splitTextItems(values.steps);

    if (!values.title.trim()) {
      setMessage("제목은 비어 있을 수 없습니다.");
      setSubmitting(false);
      return;
    }
    if (nextIngredients.length === 0 || nextSteps.length === 0) {
      setMessage("재료와 단계는 모두 1개 이상 입력하세요.");
      setSubmitting(false);
      return;
    }

    try {
      await updateRecipe(recipe.id, {
        title: values.title.trim(),
        description: values.description,
        ingredients: nextIngredients,
        steps: nextSteps,
        prep_time_min: values.prepTime ? Number(values.prepTime) : undefined,
        cook_time_min: values.cookTime ? Number(values.cookTime) : undefined,
        servings: values.servings ? Number(values.servings) : undefined,
        category: values.category || undefined,
        tags: tagsFromText(values.tags),
        is_public: values.isPublic,
      });
      router.push(`/recipes/${recipe.id}`);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Skeleton className="h-[720px] rounded-[28px]" />
          <Skeleton className="h-[720px] rounded-[28px]" />
        </div>
      </section>
    );
  }

  if (!recipe) {
    return (
      <section className="space-y-4">
        <StatusBanner message={message || "수정할 레시피를 찾을 수 없습니다."} tone="error" />
        <Button asChild variant="outline">
          <Link href="/recipes">목록으로 돌아가기</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge variant="secondary" className="w-fit rounded-full px-3">
            Edit
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">레시피 수정</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              기존 레시피 구조를 다듬고, 공개 여부와 태그까지 한 번에 업데이트합니다.
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/recipes/${recipe.id}`}>상세 페이지로 돌아가기</Link>
        </Button>
      </div>

      <Card className="border-white/70 bg-white/82 shadow-lg shadow-orange-950/5 backdrop-blur">
        <CardContent className="px-6 py-5">
          <p className="text-sm leading-6 text-muted-foreground">
            현재 편집 중인 레시피:
            <span className="ml-2 font-medium text-foreground">{recipe.title}</span>
          </p>
        </CardContent>
      </Card>

      <RecipeForm
        heading={`"${recipe.title}" 수정`}
        description="텍스트와 메타데이터를 정리한 뒤 저장하면 상세 페이지에서 바로 결과를 확인할 수 있습니다."
        submitLabel="변경 저장"
        loading={submitting}
        message={message}
        values={values}
        onSubmit={onSubmit}
        onChange={updateField}
      />
    </section>
  );
}
