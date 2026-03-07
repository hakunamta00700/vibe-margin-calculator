import { RecipePayloadItem } from "@/lib/recipe-api";

export type RecipeFormValues = {
  title: string;
  description: string;
  ingredients: string;
  steps: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  category: string;
  tags: string;
  isPublic: boolean;
};

export const EMPTY_RECIPE_FORM_VALUES: RecipeFormValues = {
  title: "",
  description: "",
  ingredients: "",
  steps: "",
  prepTime: "",
  cookTime: "",
  servings: "",
  category: "",
  tags: "",
  isPublic: false,
};

export function splitTextItems(value: string): RecipePayloadItem[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ text: line }));
}

export function joinTextItems(items: RecipePayloadItem[]) {
  return items.map((item) => String(item.text ?? item.value ?? item.label ?? "")).join("\n");
}

export function listFromText(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function tagsFromText(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
