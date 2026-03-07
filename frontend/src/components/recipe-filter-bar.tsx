"use client";

import { FormEvent, ReactNode } from "react";
import { SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type RecipeSortOrder = "created_at" | "updated_at" | "title";
export type RecipeDirection = "asc" | "desc";

type RecipeFilterBarProps = {
  title?: string;
  description?: string;
  query: string;
  category: string;
  sort: RecipeSortOrder;
  order: RecipeDirection;
  loading: boolean;
  action?: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: RecipeSortOrder) => void;
  onOrderChange: (value: RecipeDirection) => void;
};

export function RecipeFilterBar({
  title = "필터",
  description = "검색어와 정렬 기준을 조합해 원하는 레시피만 추려보세요.",
  query,
  category,
  sort,
  order,
  loading,
  action,
  onSubmit,
  onQueryChange,
  onCategoryChange,
  onSortChange,
  onOrderChange,
}: RecipeFilterBarProps) {
  return (
    <Card className="border-white/70 bg-white/85 shadow-xl shadow-orange-950/5 backdrop-blur">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <SlidersHorizontalIcon className="size-4 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {action ? <div className="flex items-center">{action}</div> : null}
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.35fr_1fr_0.85fr_0.85fr_auto] xl:items-end"
        >
          <div className="space-y-2">
            <Label htmlFor="query">검색어</Label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="query"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="예: 식빵, 케이크, 크림"
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">카테고리</Label>
            <Input
              id="category"
              value={category}
              onChange={(event) => onCategoryChange(event.target.value)}
              placeholder="예: 베이킹"
            />
          </div>
          <div className="space-y-2">
            <Label>정렬</Label>
            <Select value={sort} onValueChange={(value) => onSortChange(value as RecipeSortOrder)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="정렬 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">최신 등록순</SelectItem>
                <SelectItem value="updated_at">최근 수정순</SelectItem>
                <SelectItem value="title">이름순</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>방향</Label>
            <Select value={order} onValueChange={(value) => onOrderChange(value as RecipeDirection)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="방향 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">내림차순</SelectItem>
                <SelectItem value="asc">오름차순</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full xl:w-auto" disabled={loading}>
            {loading ? "불러오는 중" : "적용"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
