"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  deleteRecipe,
  getCurrentUserIdFromToken,
  getRecipe,
  getAssetUrl,
  publishRecipe,
  Recipe,
  uploadCover,
} from "@/lib/recipe-api";

export default function RecipeDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const recipeId = Number(params.id);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const ownerId = getCurrentUserIdFromToken();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getRecipe(recipeId);
      setRecipe(data);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [recipeId]);

  const onDelete = async () => {
    if (!recipe) {
      return;
    }
    if (!window.confirm("정말 삭제하시겠습니까?")) {
      return;
    }
    try {
      await deleteRecipe(recipe.id);
      router.push("/recipes");
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const onPublish = async () => {
    if (!recipe) {
      return;
    }
    try {
      const updated = await publishRecipe(recipe.id, !recipe.is_public);
      setRecipe(updated);
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const onUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("cover") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
    if (!recipe || !file) {
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const result = await uploadCover(recipe.id, file);
      setRecipe((prev) => (prev ? { ...prev, cover_image_url: result.cover_image_url } : prev));
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setUploading(false);
      form.reset();
    }
  };

  const isOwner = ownerId !== null && String(recipe?.user_id) === ownerId;

  if (loading) {
    return <p>로딩 중...</p>;
  }

  if (!recipe) {
    return <p>{message || "레시피를 불러올 수 없습니다."}</p>;
  }

  return (
    <section>
      <h1>{recipe.title}</h1>
      <div className="card">
        <p>공개 여부: {recipe.is_public ? "공개" : "비공개"}</p>
        <p>{recipe.description || "설명 없음"}</p>
        <p>카테고리: {recipe.category || "미지정"}</p>
        <p>준비/조리 시간: {(recipe.prep_time_min ?? 0)}분 / {(recipe.cook_time_min ?? 0)}분</p>
        <p>분량: {recipe.servings ?? "미지정"}인분</p>
        {recipe.cover_image_url && (
          <img
            src={getAssetUrl(recipe.cover_image_url) ?? ""}
            alt={recipe.title}
            style={{ maxWidth: "100%", borderRadius: 8 }}
          />
        )}
        <p>
          생성: {new Date(recipe.created_at).toLocaleString()} / 수정: {new Date(recipe.updated_at).toLocaleString()}
        </p>
      </div>

      <div className="card toolbar">
        <h3>재료</h3>
        <ul>
          {recipe.ingredients.map((item, index) => (
            <li key={index}>{(item.text as string) || JSON.stringify(item)}</li>
          ))}
        </ul>
      </div>
      <div className="card toolbar">
        <h3>조리 단계</h3>
        <ol>
          {recipe.steps.map((item, index) => (
            <li key={index}>{(item.text as string) || JSON.stringify(item)}</li>
          ))}
        </ol>
      </div>

      {isOwner && (
        <div className="card toolbar">
          <Link href={`/recipes/${recipe.id}/edit`}>수정 페이지</Link>
          <button onClick={onPublish}>{recipe.is_public ? "비공개로 전환" : "공개로 전환"}</button>
          <button onClick={onDelete}>삭제</button>
          <form onSubmit={onUpload} className="toolbar">
            <input name="cover" type="file" accept="image/jpeg,image/png,image/webp" required />
            <button type="submit" disabled={uploading}>
              {uploading ? "업로드 중" : "대표 이미지 업로드"}
            </button>
          </form>
        </div>
      )}

      <p>
        <Link href="/recipes">목록으로</Link>
      </p>
      {message && <p style={{ color: "crimson" }}>{message}</p>}
    </section>
  );
}
