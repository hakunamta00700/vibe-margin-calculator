"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { RecipeForm } from "@/components/recipe-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createRecipe, getAuthToken } from "@/lib/recipe-api";
import {
  EMPTY_RECIPE_FORM_VALUES,
  RecipeFormValues,
  splitTextItems,
  tagsFromText,
} from "@/lib/recipe-form";

export default function NewRecipePage() {
  const router = useRouter();
  const [values, setValues] = useState<RecipeFormValues>(EMPTY_RECIPE_FORM_VALUES);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof RecipeFormValues, value: string | boolean) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!getAuthToken()) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setMessage("");

    const parsedIngredients = splitTextItems(values.ingredients);
    const parsedSteps = splitTextItems(values.steps);

    if (parsedIngredients.length === 0) {
      setMessage("재료를 최소 1개 입력하세요.");
      setLoading(false);
      return;
    }
    if (parsedSteps.length === 0) {
      setMessage("조리 단계를 최소 1개 입력하세요.");
      setLoading(false);
      return;
    }
    if (!values.title.trim()) {
      setMessage("제목은 비어 있을 수 없습니다.");
      setLoading(false);
      return;
    }

    try {
      await createRecipe({
        title: values.title.trim(),
        description: values.description,
        ingredients: parsedIngredients,
        steps: parsedSteps,
        prep_time_min: values.prepTime ? Number(values.prepTime) : undefined,
        cook_time_min: values.cookTime ? Number(values.cookTime) : undefined,
        servings: values.servings ? Number(values.servings) : undefined,
        category: values.category || undefined,
        tags: tagsFromText(values.tags),
        is_public: values.isPublic,
      });
      router.push("/recipes");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge variant="secondary" className="w-fit rounded-full px-3">
            Create
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">레시피 등록</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              재료와 공정을 한 번에 정리하고, 공개 여부까지 저장 전에 바로 확인할 수 있습니다.
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/recipes">내 레시피로 돌아가기</Link>
        </Button>
      </div>

      <RecipeForm
        heading="새 레시피 초안"
        description="작업용 레시피라도 구조를 먼저 정리해두면 공개 전환과 수정 흐름이 빨라집니다."
        submitLabel="레시피 저장"
        loading={loading}
        message={message}
        values={values}
        onSubmit={onSubmit}
        onChange={updateField}
      />
    </section>
  );
}
