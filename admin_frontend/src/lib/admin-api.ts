"use client";

const DEFAULT_API_BASE_URL = "http://localhost:8000";
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1"]);

const AUTH_STORAGE_KEY = "vibe_recipe_admin_access_token";
const AUTH_EVENT = "vibe_recipe_admin_auth_change";

export type Role = "user" | "admin";

export type SessionUser = {
  id: number;
  email: string;
  role: Role;
  created_at?: string | null;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user?: SessionUser;
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

export type UserRecord = {
  id: number;
  email: string;
  role: Role;
  created_at?: string | null;
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

export class AdminApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

type ApiError = {
  error: {
    code: string;
    message: string;
  };
};

type RecipeQueryParams = {
  q?: string;
  category?: string;
  sort?: "created_at" | "updated_at" | "title";
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
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

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

function buildQueryString(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") {
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
      throw new AdminApiError(error.error.message, error.error.code, response.status);
    }
    throw new AdminApiError("Request failed.", "REQUEST_FAILED", response.status);
  }
  return payload as T;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  options: { withAuth?: boolean } = {},
) {
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
    cache: "no-store",
  });

  return parseJsonResponse<T>(response);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(AUTH_STORAGE_KEY);
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, token);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearAuthToken() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getAuthEventName() {
  return AUTH_EVENT;
}

export function getCurrentSession(): SessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = getAuthToken();
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as {
      sub?: string;
      email?: string;
      role?: Role;
    };

    if (!payload.sub || !payload.email || !payload.role) {
      return null;
    }

    return {
      id: Number(payload.sub),
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
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

export async function signIn(email: string, password: string) {
  return request<AuthResponse>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    { withAuth: false },
  );
}

export async function listMaterials(params: MaterialQueryParams = {}) {
  const query = buildQueryString({
    limit: 1000,
    offset: 0,
    ...params,
  });
  return request<Material[]>(`/api/admin/materials${query}`, { method: "GET" });
}

export async function createMaterial(payload: MaterialInput) {
  return request<Material>("/api/admin/materials", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMaterial(id: number, payload: Partial<MaterialInput>) {
  return request<Material>(`/api/admin/materials/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteMaterial(id: number) {
  return request<{ success: boolean }>(`/api/admin/materials/${id}`, { method: "DELETE" });
}

export async function reseedMaterials() {
  return request<SeedSyncResult>("/api/admin/materials/reseed", { method: "POST" });
}

export async function listUsers() {
  return request<UserRecord[]>("/api/admin/users", { method: "GET" });
}

export async function updateUserRole(userId: number, role: Role) {
  return request<UserRecord>(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function listRecipes(params: RecipeQueryParams = {}) {
  const query = buildQueryString(params);
  return request<Recipe[]>(`/api/recipes${query}`, { method: "GET" });
}

export async function listAllRecipes(params: Omit<RecipeQueryParams, "limit" | "offset"> = {}) {
  const rows: Recipe[] = [];
  let offset = 0;
  const batchSize = 100;

  while (true) {
    const batch = await listRecipes({ ...params, limit: batchSize, offset });
    rows.push(...batch);
    if (batch.length < batchSize) {
      break;
    }
    offset += batchSize;
  }

  return rows;
}

export async function getRecipe(id: number) {
  return request<Recipe>(`/api/recipes/${id}`, { method: "GET" });
}

export async function publishRecipe(id: number, isPublic: boolean) {
  return request<Recipe>(`/api/recipes/${id}/publish`, {
    method: "PATCH",
    body: JSON.stringify({ is_public: isPublic }),
  });
}

export async function deleteRecipe(id: number) {
  return request<{ success: boolean }>(`/api/recipes/${id}`, { method: "DELETE" });
}
