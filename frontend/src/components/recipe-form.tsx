"use client";

import { FormEvent } from "react";
import { BookTextIcon, Clock3Icon, EyeIcon, ListChecksIcon, TagIcon } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RecipeFormValues, listFromText, tagsFromText } from "@/lib/recipe-form";
import { StatusBanner } from "@/components/status-banner";

type RecipeFormProps = {
  heading: string;
  description: string;
  submitLabel: string;
  loading: boolean;
  message?: string;
  messageTone?: "error" | "success" | "info";
  showTags?: boolean;
  values: RecipeFormValues;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onChange: (field: keyof RecipeFormValues, value: string | boolean) => void;
};

export function RecipeForm({
  heading,
  description,
  submitLabel,
  loading,
  message,
  messageTone = "error",
  showTags = true,
  values,
  onSubmit,
  onChange,
}: RecipeFormProps) {
  const ingredientLines = listFromText(values.ingredients);
  const stepLines = listFromText(values.steps);
  const tags = tagsFromText(values.tags);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-white/70 bg-white/88 shadow-2xl shadow-orange-950/5 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl tracking-tight">{heading}</CardTitle>
          <CardDescription className="max-w-2xl leading-6">{description}</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  value={values.title}
                  onChange={(event) => onChange("title", event.target.value)}
                  placeholder="판매용 또는 작업용 제목을 입력하세요"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={values.description}
                  onChange={(event) => onChange("description", event.target.value)}
                  placeholder="메뉴 설명, 판매 포인트, 보관 팁 등을 적어두세요"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Input
                  id="category"
                  value={values.category}
                  onChange={(event) => onChange("category", event.target.value)}
                  placeholder="예: 베이킹, 샌드위치"
                />
              </div>
              {showTags ? (
                <div className="space-y-2">
                  <Label htmlFor="tags">태그</Label>
                  <Input
                    id="tags"
                    value={values.tags}
                    onChange={(event) => onChange("tags", event.target.value)}
                    placeholder="쉼표로 구분해 입력"
                  />
                </div>
              ) : null}
              <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/80 p-4 md:col-span-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="is-public"
                    checked={values.isPublic}
                    onCheckedChange={(checked) => onChange("isPublic", checked === true)}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="is-public" className="cursor-pointer text-sm font-medium">
                      공개 레시피로 노출하기
                    </Label>
                    <p className="text-sm leading-6 text-muted-foreground">
                      활성화하면 공개 페이지에서 누구나 이 레시피를 볼 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock3Icon className="size-4 text-primary" />
                <h2 className="text-base font-semibold">조리 정보</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="prep-time">준비 시간(분)</Label>
                  <Input
                    id="prep-time"
                    type="number"
                    min={0}
                    value={values.prepTime}
                    onChange={(event) => onChange("prepTime", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cook-time">조리 시간(분)</Label>
                  <Input
                    id="cook-time"
                    type="number"
                    min={0}
                    value={values.cookTime}
                    onChange={(event) => onChange("cookTime", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="servings">인분</Label>
                  <Input
                    id="servings"
                    type="number"
                    min={0}
                    value={values.servings}
                    onChange={(event) => onChange("servings", event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookTextIcon className="size-4 text-primary" />
                  <Label htmlFor="ingredients" className="text-base font-semibold">
                    재료
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">한 줄에 한 재료씩 입력합니다.</p>
                <Textarea
                  id="ingredients"
                  rows={12}
                  value={values.ingredients}
                  onChange={(event) => onChange("ingredients", event.target.value)}
                  placeholder={"강력분 250g\n버터 30g\n우유 160ml"}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ListChecksIcon className="size-4 text-primary" />
                  <Label htmlFor="steps" className="text-base font-semibold">
                    조리 단계
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">공정 순서대로 한 줄씩 정리합니다.</p>
                <Textarea
                  id="steps"
                  rows={12}
                  value={values.steps}
                  onChange={(event) => onChange("steps", event.target.value)}
                  placeholder={"반죽 재료를 모두 섞는다\n1차 발효 후 분할한다\n오븐에서 굽는다"}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-md">
              <StatusBanner message={message} tone={messageTone} />
            </div>
            <Button type="submit" size="lg" disabled={loading} className="sm:min-w-36">
              {loading ? "저장 중" : submitLabel}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="border-white/70 bg-white/80 shadow-xl shadow-orange-950/5 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <EyeIcon className="size-5 text-primary" />
            입력 미리보기
          </CardTitle>
          <CardDescription>입력한 내용이 어떻게 정리되는지 바로 확인할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{values.category || "미분류"}</Badge>
              <Badge variant={values.isPublic ? "secondary" : "outline"}>
                {values.isPublic ? "공개" : "비공개"}
              </Badge>
              {values.prepTime || values.cookTime ? (
                <Badge variant="secondary">
                  총 {(Number(values.prepTime || 0) + Number(values.cookTime || 0)).toString()}분
                </Badge>
              ) : null}
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">
                {values.title || "아직 제목이 없습니다"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {values.description || "설명을 입력하면 여기에서 요약 문장을 확인할 수 있습니다."}
              </p>
            </div>
          </div>

          {showTags && tags.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TagIcon className="size-4 text-primary" />
                태그
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="ghost" className="rounded-full bg-emerald-50 text-emerald-900">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-border/70 bg-orange-50/70 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium">재료</h3>
                <Badge variant="outline">{ingredientLines.length}개</Badge>
              </div>
              {ingredientLines.length > 0 ? (
                <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                  {ingredientLines.map((item) => (
                    <li key={item} className="rounded-xl bg-white/70 px-3 py-2">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">재료를 입력하면 목록이 여기에 정리됩니다.</p>
              )}
            </div>
            <div className="rounded-2xl border border-border/70 bg-emerald-50/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium">조리 단계</h3>
                <Badge variant="outline">{stepLines.length}단계</Badge>
              </div>
              {stepLines.length > 0 ? (
                <ol className="space-y-2 text-sm leading-6 text-muted-foreground">
                  {stepLines.map((item, index) => (
                    <li key={`${index}-${item}`} className="rounded-xl bg-white/70 px-3 py-2">
                      <span className="mr-2 font-semibold text-foreground">{index + 1}.</span>
                      {item}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">조리 단계를 입력하면 여기에 단계별로 표시됩니다.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
