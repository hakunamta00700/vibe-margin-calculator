"use client";

import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getCurrentUserIdFromToken, getRecipe, Recipe, RecipePayloadItem, updateRecipe } from "@/lib/recipe-api";

function splitToItems(value: string): RecipePayloadItem[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ text: line }));
}

function itemsToText(items: RecipePayloadItem[]) {
  return items.map((item) => String(item.text ?? item.value ?? item.label ?? "")).join("\n");
}

export default function EditRecipePage() {
  const params = useParams<{ id: string }>();
  const recipeId = Number(params.id);
  const router = useRouter();
  const ownerId = getCurrentUserIdFromToken();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(false);
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
        setTitle(data.title);
        setDescription(data.description || "");
        setIngredients(itemsToText(data.ingredients));
        setSteps(itemsToText(data.steps));
        setPrepTime(data.prep_time_min ? String(data.prep_time_min) : "");
        setCookTime(data.cook_time_min ? String(data.cook_time_min) : "");
        setServings(data.servings ? String(data.servings) : "");
        setCategory(data.category || "");
        setIsPublic(data.is_public);
      } catch (error) {
        setMessage((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [recipeId, ownerId, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!recipe) {
      return;
    }
    setSubmitting(true);
    setMessage("");

    const nextIngredients = splitToItems(ingredients);
    const nextSteps = splitToItems(steps);
    if (!title.trim()) {
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
        title: title.trim(),
        description,
        ingredients: nextIngredients,
        steps: nextSteps,
        prep_time_min: prepTime ? Number(prepTime) : undefined,
        cook_time_min: cookTime ? Number(cookTime) : undefined,
        servings: servings ? Number(servings) : undefined,
        category: category || undefined,
        is_public: isPublic,
      });
      router.push(`/recipes/${recipe.id}`);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p>로딩 중...</p>;
  }

  if (!recipe) {
    return <p>{message || "수정할 레시피를 찾을 수 없습니다."}</p>;
  }

  return (
    <section>
      <h1>레시피 수정</h1>
      <form className="card toolbar" onSubmit={onSubmit}>
        <label>
          제목 *
          <input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
        <label>
          설명
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label>
          카테고리
          <input value={category} onChange={(event) => setCategory(event.target.value)} />
        </label>
        <label>
          재료 (한 줄씩 입력)
          <textarea rows={8} value={ingredients} onChange={(event) => setIngredients(event.target.value)} />
        </label>
        <label>
          조리 단계 (한 줄씩 입력)
          <textarea rows={8} value={steps} onChange={(event) => setSteps(event.target.value)} />
        </label>
        <label>
          준비 시간(분)
          <input type="number" value={prepTime} onChange={(event) => setPrepTime(event.target.value)} />
        </label>
        <label>
          조리 시간(분)
          <input type="number" value={cookTime} onChange={(event) => setCookTime(event.target.value)} />
        </label>
        <label>
          인분
          <input type="number" value={servings} onChange={(event) => setServings(event.target.value)} />
        </label>
        <label>
          공개 설정
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "저장 중" : "저장"}
        </button>
      </form>
      {message && <p style={{ color: "crimson" }}>{message}</p>}
    </section>
  );
}
