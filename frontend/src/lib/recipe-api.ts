"use client";

const DEFAULT_API_BASE_URL = "http://localhost:8000";
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1"]);
const AUTH_STORAGE_KEY = "vibe_recipe_access_token";
const AUTH_EVENT = "vibe_recipe_auth_change";

type TokenPayload = {
  sub?: string;
  email?: string;
  role?: "user" | "admin";
};

export type RecipePayloadItem = Record<string, string | number | boolean | null>;

export type Recipe = {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  ingredients: RecipePayloadItem[];
  steps: RecipePayloadItem[];
  prep_time_min: number | null;
  cook_time_min: number | null;
  servings: number | null;
  category: string | null;
  tags: string[];
  is_public: boolean;
  cover_image_url: string | null;
  source_url: string | null;
  nutrition: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type Material = {
  id: number;
  name: string;
  price: number;
  weight_g: number;
  price_per_g: number;
  coupang_link: string | null;
  source_keyword: string | null;
  product_id: string | null;
  seed_sources: string[];
  is_manual: boolean;
  created_at: string;
  updated_at: string;
};

export type MaterialInput = {
  name: string;
  price: number;
  weight_g: number;
  coupang_link?: string;
  source_keyword?: string;
  product_id?: string;
};

export type SeedSyncResult = {
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  sources: string[];
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user?: {
    id: number;
    email: string;
    role: "user" | "admin";
  };
};

export type RecipeCreateInput = {
  title: string;
  description?: string;
  ingredients: RecipePayloadItem[];
  steps: RecipePayloadItem[];
  prep_time_min?: number;
  cook_time_min?: number;
  servings?: number;
  category?: string;
  tags?: string[];
  is_public?: boolean;
  cover_image_url?: string;
  source_url?: string;
};

export type RecipePatchInput = Partial<RecipeCreateInput>;

export type ApiError = {
  error: {
    code: string;
    message: string;
  };
};

export class AppApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

type RecipeQueryParams = {
  q?: string;
  category?: string;
  sort?: "created_at" | "updated_at" | "title";
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
  open?: boolean;
};

type MaterialQueryParams = {
  q?: string;
  limit?: number;
  offset?: number;
};

function getApiBaseUrl(): string {
  const configuredBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(
    /\/$/,
    "",
  );

  if (typeof window === "undefined") {
    return configuredBaseUrl;
  }

  try {
    const resolvedUrl = new URL(configuredBaseUrl, window.location.origin);
    if (
      LOOPBACK_HOSTS.has(resolvedUrl.hostname) &&
      LOOPBACK_HOSTS.has(window.location.hostname) &&
      resolvedUrl.hostname !== window.location.hostname
    ) {
      resolvedUrl.hostname = window.location.hostname;
      resolvedUrl.protocol = window.location.protocol;
    }
    return resolvedUrl.toString().replace(/\/$/, "");
  } catch {
    return configuredBaseUrl;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(AUTH_STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, token);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function parseAuthTokenPayload(): TokenPayload | null {
  const token = getAuthToken();
  if (!token || typeof window === "undefined") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    return JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as TokenPayload;
  } catch {
    return null;
  }
}

export function getCurrentUserIdFromToken(): string | null {
  return parseAuthTokenPayload()?.sub ?? null;
}

export function getCurrentUserRoleFromToken(): "user" | "admin" | null {
  const role = parseAuthTokenPayload()?.role;
  if (role === "admin" || role === "user") {
    return role;
  }
  return null;
}

export function getAssetUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${getApiBaseUrl()}${path}`;
}

function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === null) {
      continue;
    }
    query.set(key, String(value));
  }
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T | ApiError;
  if (!response.ok) {
    const error = payload as ApiError;
    if (typeof error === "object" && error && "error" in error) {
      throw new AppApiError(error.error.message, error.error.code, response.status);
    }
    throw new AppApiError("요청 처리에 실패했습니다.", "REQUEST_FAILED", response.status);
  }
  return payload as T;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  options: { withAuth?: boolean } = {},
): Promise<T> {
  const withAuth = options.withAuth ?? true;
  const headers = new Headers(init.headers ?? {});

  if (!(init.body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (withAuth) {
    const token = getAuthToken();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  return parseJsonResponse<T>(response);
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>(
    "/api/auth/sign-in",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    { withAuth: false },
  );
}

export async function signUp(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>(
    "/api/auth/sign-up",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    { withAuth: false },
  );
}

export async function signOut(): Promise<{ success: boolean }> {
  return request<{ success: boolean }>("/api/auth/sign-out", { method: "POST" }, { withAuth: true });
}

export async function resetPassword(email: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(
    "/api/auth/reset-password",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
    { withAuth: false },
  );
}

export async function listPublicRecipes(
  params: Omit<RecipeQueryParams, "open">,
): Promise<Recipe[]> {
  const qs = buildQueryString({
    sort: "created_at",
    order: "desc",
    limit: 20,
    ...params,
    open: undefined,
  });
  return request<Recipe[]>(`/api/recipes/public${qs}`, { method: "GET" }, { withAuth: false });
}

export async function listRecipes(
  params: Omit<RecipeQueryParams, "open"> & { open?: boolean },
): Promise<Recipe[]> {
  const qs = buildQueryString({ ...params, open: params.open ?? false });
  return request<Recipe[]>(`/api/recipes${qs}`, { method: "GET" });
}

export async function getRecipe(id: number): Promise<Recipe> {
  return request<Recipe>(`/api/recipes/${id}`, { method: "GET" });
}

export async function createRecipe(payload: RecipeCreateInput): Promise<Recipe> {
  return request<Recipe>("/api/recipes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRecipe(id: number, payload: RecipePatchInput): Promise<Recipe> {
  return request<Recipe>(`/api/recipes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function publishRecipe(id: number, isPublic: boolean): Promise<Recipe> {
  return request<Recipe>(`/api/recipes/${id}/publish`, {
    method: "PATCH",
    body: JSON.stringify({ is_public: isPublic }),
  });
}

export async function deleteRecipe(id: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/api/recipes/${id}`, { method: "DELETE" });
}

export async function uploadCover(
  id: number,
  file: File,
): Promise<{ success: boolean; cover_image_url: string }> {
  const form = new FormData();
  form.append("file", file);
  return request<{ success: boolean; cover_image_url: string }>(`/api/recipes/${id}/cover`, {
    method: "POST",
    body: form,
  });
}

export async function deleteAccount(): Promise<{ success: boolean; deleted_recipes: number }> {
  return request<{ success: boolean; deleted_recipes: number }>("/api/account", {
    method: "DELETE",
  });
}

export async function listMaterials(params: MaterialQueryParams = {}): Promise<Material[]> {
  const qs = buildQueryString({
    limit: 1000,
    offset: 0,
    ...params,
  });
  return request<Material[]>(`/api/materials${qs}`, { method: "GET" }, { withAuth: false });
}

export async function listAdminMaterials(params: MaterialQueryParams = {}): Promise<Material[]> {
  const qs = buildQueryString({
    limit: 1000,
    offset: 0,
    ...params,
  });
  return request<Material[]>(`/api/admin/materials${qs}`, { method: "GET" });
}

export async function createMaterial(payload: MaterialInput): Promise<Material> {
  return request<Material>("/api/admin/materials", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMaterial(
  id: number,
  payload: Partial<MaterialInput>,
): Promise<Material> {
  return request<Material>(`/api/admin/materials/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteMaterial(id: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/api/admin/materials/${id}`, { method: "DELETE" });
}

export async function reseedMaterials(): Promise<SeedSyncResult> {
  return request<SeedSyncResult>("/api/admin/materials/reseed", { method: "POST" });
}
