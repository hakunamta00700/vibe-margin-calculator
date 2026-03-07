"use client";

import Link from "next/link";
import { Clock3Icon, Globe2Icon, LockKeyholeIcon, NotebookPenIcon, TagsIcon } from "lucide-react";
import { Recipe } from "@/lib/recipe-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RecipeCardProps = {
  recipe: Recipe;
  href?: string;
  actionLabel?: string;
  showVisibility?: boolean;
};

function getTotalTimeLabel(recipe: Recipe) {
  const minutes = (recipe.prep_time_min ?? 0) + (recipe.cook_time_min ?? 0);
  return minutes > 0 ? `${minutes}분` : null;
}

export function RecipeCard({
  recipe,
  href = `/recipes/${recipe.id}`,
  actionLabel = "상세 보기",
  showVisibility = false,
}: RecipeCardProps) {
  const totalTime = getTotalTimeLabel(recipe);

  return (
    <Card className="h-full border-white/70 bg-white/85 shadow-xl shadow-orange-950/5 backdrop-blur">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{recipe.category || "미분류"}</Badge>
          {showVisibility ? (
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
          ) : null}
          {totalTime ? (
            <Badge variant="secondary">
              <Clock3Icon className="size-3" />
              {totalTime}
            </Badge>
          ) : null}
        </div>
        <div className="space-y-2">
          <CardTitle className="text-xl tracking-tight">{recipe.title}</CardTitle>
          <CardDescription className="line-clamp-2 leading-6">
            {recipe.description || "간단한 설명이 아직 등록되지 않았습니다."}
          </CardDescription>
        </div>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href={href}>{actionLabel}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {recipe.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {recipe.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="ghost" className="rounded-full bg-orange-50 text-orange-900">
                <TagsIcon className="size-3" />
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p className="flex items-center gap-2">
            <NotebookPenIcon className="size-4" />
            수정 {new Date(recipe.updated_at).toLocaleString("ko-KR")}
          </p>
          <p>인분 {recipe.servings ?? "미정"}</p>
        </div>
      </CardContent>
      <CardFooter className="justify-between gap-3 bg-orange-50/60">
        <span className="text-sm text-muted-foreground">
          생성 {new Date(recipe.created_at).toLocaleDateString("ko-KR")}
        </span>
        <Button asChild>
          <Link href={href}>{actionLabel}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
