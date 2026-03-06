"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createRecipe, getAuthToken, RecipePayloadItem } from "@/lib/recipe-api";

function splitToItems(value: string): RecipePayloadItem[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ text: line }));
}

function joinItems(items: RecipePayloadItem[]) {
  return items.map((item) => String(item.text ?? item.value ?? item.label ?? "")).join("\n");
}

export default function NewRecipePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!getAuthToken()) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setMessage("");

    const parsedIngredients = splitToItems(ingredients);
    const parsedSteps = splitToItems(steps);
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
    if (!title.trim()) {
      setMessage("제목은 비어 있을 수 없습니다.");
      setLoading(false);
      return;
    }

    try {
      await createRecipe({
        title: title.trim(),
        description,
        ingredients: parsedIngredients,
        steps: parsedSteps,
        prep_time_min: prepTime ? Number(prepTime) : undefined,
        cook_time_min: cookTime ? Number(cookTime) : undefined,
        servings: servings ? Number(servings) : undefined,
        category: category || undefined,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        is_public: isPublic,
      });
      setMessage("저장 완료");
      router.push("/recipes");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h1>레시피 등록</h1>
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
          태그 (쉼표 구분)
          <input value={tags} onChange={(event) => setTags(event.target.value)} />
        </label>
        <label>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
          />
          공개 설정
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "저장 중" : "저장"}
        </button>
      </form>
      {message && <p>{message}</p>}
      <div>
        <h3>미리보기</h3>
        <p>재료</p>
        <pre>{joinItems(splitToItems(ingredients))}</pre>
        <p>단계</p>
        <pre>{joinItems(splitToItems(steps))}</pre>
      </div>
    </section>
  );
}
