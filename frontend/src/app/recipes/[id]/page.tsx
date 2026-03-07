"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BookOpenTextIcon,
  Clock3Icon,
  Globe2Icon,
  ImageUpIcon,
  LockKeyholeIcon,
  PencilLineIcon,
  Trash2Icon,
} from "lucide-react";
import { StatusBanner } from "@/components/status-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteRecipe,
  getAssetUrl,
  getCurrentUserIdFromToken,
  getRecipe,
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
  const [messageTone, setMessageTone] = useState<"error" | "success" | "info">("info");
  const [uploading, setUploading] = useState(false);

  const ownerId = getCurrentUserIdFromToken();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getRecipe(recipeId);
      setRecipe(data);
      setMessage("");
    } catch (error) {
      setMessageTone("error");
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
      setMessageTone("error");
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
      setMessageTone("success");
      setMessage(updated.is_public ? "레시피를 공개 상태로 전환했습니다." : "레시피를 비공개 상태로 전환했습니다.");
    } catch (error) {
      setMessageTone("error");
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
      setMessageTone("success");
      setMessage("대표 이미지를 업로드했습니다.");
    } catch (error) {
      setMessageTone("error");
      setMessage((error as Error).message);
    } finally {
      setUploading(false);
      form.reset();
    }
  };

  const isOwner = ownerId !== null && String(recipe?.user_id) === ownerId;

  if (loading) {
    return (
      <section className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Skeleton className="h-[520px] rounded-[28px]" />
          <Skeleton className="h-[520px] rounded-[28px]" />
        </div>
      </section>
    );
  }

  if (!recipe) {
    return (
      <section className="space-y-4">
        <StatusBanner message={message || "레시피를 불러올 수 없습니다."} tone="error" />
        <Button asChild variant="outline">
          <Link href="/">공개 레시피로 돌아가기</Link>
        </Button>
      </section>
    );
  }

  const totalTime = (recipe.prep_time_min ?? 0) + (recipe.cook_time_min ?? 0);

  return (
    <section className="space-y-6">
      <StatusBanner message={message} tone={messageTone} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-white/70 bg-white/88 shadow-2xl shadow-orange-950/5 backdrop-blur">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{recipe.category || "미분류"}</Badge>
              <Badge variant={recipe.is_public ? "secondary" : "outline"}>
                {recipe.is_public ? (
                  <>
                    <Globe2Icon className="size-3" />
                    공개
                  </>
                ) : (
                  <>
                    <LockKeyholeIcon className="size-3" />
                    비공개
                  </>
                )}
              </Badge>
              {totalTime > 0 ? (
                <Badge variant="secondary">
                  <Clock3Icon className="size-3" />
                  총 {totalTime}분
                </Badge>
              ) : null}
            </div>
            <div className="space-y-3">
              <CardTitle className="text-3xl tracking-tight sm:text-4xl">{recipe.title}</CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-7 sm:text-base">
                {recipe.description || "설명이 아직 등록되지 않았습니다."}
              </CardDescription>
            </div>
            {recipe.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <Badge key={tag} variant="ghost" className="rounded-full bg-emerald-50 text-emerald-900">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-5">
            {recipe.cover_image_url ? (
              <img
                src={getAssetUrl(recipe.cover_image_url) ?? ""}
                alt={recipe.title}
                className="aspect-[4/3] w-full rounded-[24px] object-cover shadow-lg shadow-orange-950/10"
              />
            ) : (
              <div className="grid aspect-[4/3] place-items-center rounded-[24px] border border-dashed border-orange-200 bg-orange-50/70">
                <p className="text-sm text-muted-foreground">대표 이미지가 아직 없습니다.</p>
              </div>
            )}
            <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <p>준비 시간 {recipe.prep_time_min ?? 0}분</p>
              <p>조리 시간 {recipe.cook_time_min ?? 0}분</p>
              <p>인분 {recipe.servings ?? "미정"}</p>
              <p>수정 {new Date(recipe.updated_at).toLocaleString("ko-KR")}</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3 bg-orange-50/60">
            <span className="text-sm text-muted-foreground">
              생성 {new Date(recipe.created_at).toLocaleString("ko-KR")}
            </span>
            <Button asChild variant="outline">
              <Link href="/recipes">목록으로 돌아가기</Link>
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-4">
          <Card className="border-white/70 bg-white/82 shadow-lg shadow-orange-950/5 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl tracking-tight">요약 정보</CardTitle>
              <CardDescription>공개 여부와 작업량을 한눈에 확인할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-orange-100 bg-orange-50/80 p-4">
                <p className="text-sm font-medium text-muted-foreground">재료 수</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{recipe.ingredients.length}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-sm font-medium text-muted-foreground">단계 수</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{recipe.steps.length}</p>
              </div>
            </CardContent>
          </Card>

          {isOwner ? (
            <Card className="border-white/70 bg-white/82 shadow-lg shadow-orange-950/5 backdrop-blur">
              <CardHeader className="space-y-2">
                <CardTitle className="text-xl tracking-tight">소유자 작업</CardTitle>
                <CardDescription>상세 페이지에서 바로 수정, 공개 전환, 삭제를 처리할 수 있습니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href={`/recipes/${recipe.id}/edit`}>
                      <PencilLineIcon className="size-4" />
                      수정 페이지
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={onPublish}>
                    {recipe.is_public ? "비공개로 전환" : "공개로 전환"}
                  </Button>
                  <Button variant="destructive" onClick={onDelete}>
                    <Trash2Icon className="size-4" />
                    삭제
                  </Button>
                </div>

                <form
                  onSubmit={onUpload}
                  className="space-y-3 rounded-2xl border border-dashed border-border/80 bg-muted/40 p-4"
                >
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <ImageUpIcon className="size-4 text-primary" />
                      대표 이미지 업로드
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      JPG, PNG, WEBP 형식을 업로드할 수 있습니다.
                    </p>
                  </div>
                  <Input name="cover" type="file" accept="image/jpeg,image/png,image/webp" required />
                  <Button type="submit" disabled={uploading}>
                    {uploading ? "업로드 중" : "대표 이미지 업로드"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-white/70 bg-white/82 shadow-lg shadow-orange-950/5 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl tracking-tight">재료</CardTitle>
            <CardDescription>{recipe.ingredients.length}개의 재료가 정리되어 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recipe.ingredients.map((item, index) => (
                <li key={index} className="rounded-2xl bg-orange-50/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
                  {String(item.text ?? item.value ?? item.label ?? JSON.stringify(item))}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/82 shadow-lg shadow-orange-950/5 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-xl tracking-tight">
              <BookOpenTextIcon className="size-5 text-primary" />
              조리 단계
            </CardTitle>
            <CardDescription>{recipe.steps.length}단계로 정리된 공정입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {recipe.steps.map((item, index) => (
                <li
                  key={index}
                  className="rounded-2xl bg-emerald-50/70 px-4 py-3 text-sm leading-6 text-muted-foreground"
                >
                  <span className="mr-2 font-semibold text-foreground">{index + 1}.</span>
                  {String(item.text ?? item.value ?? item.label ?? JSON.stringify(item))}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
