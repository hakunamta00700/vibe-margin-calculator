# 레시피 저장형 서비스 DB 설계서

버전: v1.0  
작성일: 2026-03-06

## 1. 설계 원칙
- Supabase Auth(`auth.users`)를 사용자 주체로 사용
- 사용자 데이터 분리는 Supabase RLS로 강제
- 레시피 본문은 처음엔 단일 테이블 + JSON 필드로 시작
- 정렬·검색 성능은 초기 인덱스 + 나중 리팩터링을 고려한 설계

## 2. 데이터 모델

### 2.1 `public.recipes`
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | 레시피 식별자 |
| `user_id` | `uuid` | FK(`auth.users.id`), not null | 소유자 |
| `title` | `text` | not null | 레시피 제목 |
| `description` | `text` | nullable | 요약 설명 |
| `ingredients` | `jsonb` | not null default `[]` | 재료 목록 |
| `steps` | `jsonb` | not null default `[]` | 조리 단계 |
| `prep_time_min` | `integer` | nullable | 준비 시간(분) |
| `cook_time_min` | `integer` | nullable | 조리 시간(분) |
| `servings` | `integer` | nullable | 인분 |
| `category` | `text` | nullable | 카테고리 |
| `tags` | `text[]` | nullable | 태그 배열 |
| `is_public` | `boolean` | not null default false | 공개 여부 |
| `cover_image_url` | `text` | nullable | 대표 이미지 URL |
| `source_url` | `text` | nullable | 원본 레시피 링크(선택) |
| `nutrition` | `jsonb` | nullable | 영양 정보(선택) |
| `created_at` | `timestamptz` | not null default now() | 생성일시 |
| `updated_at` | `timestamptz` | not null default now() | 수정일시 |

### 2.2 `public.recipe_tags` (선택)
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | `uuid` | PK | 식별자 |
| `recipe_id` | `uuid` | FK(`public.recipes.id`), cascade | 레시피 참조 |
| `name` | `text` | not null | 태그명 |
| `created_at` | `timestamptz` | not null default now() | 생성일시 |

### 2.3 `public.recipe_favorites` (선택)
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | `uuid` | PK | 식별자 |
| `user_id` | `uuid` | FK(`auth.users.id`) | 즐겨찾는 사용자 |
| `recipe_id` | `uuid` | FK(`public.recipes.id`) | 레시피 |
| `created_at` | `timestamptz` | not null default now() | 생성일시 |

## 3. SQL 스키마(초안)
```sql
create extension if not exists pgcrypto;

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  prep_time_min integer,
  cook_time_min integer,
  servings integer,
  category text,
  tags text[] default '{}'::text[],
  is_public boolean not null default false,
  cover_image_url text,
  source_url text,
  nutrition jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipe_tags (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.recipe_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);

create index if not exists idx_recipes_user_id on public.recipes (user_id);
create index if not exists idx_recipes_public on public.recipes (is_public, created_at desc);
create index if not exists idx_recipes_title_fts on public.recipes using gin (to_tsvector('simple', title));
create index if not exists idx_recipes_ingredients_fts on public.recipes using gin (ingredients);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_recipes_updated_at
before update on public.recipes
for each row
execute function public.set_updated_at();
```

## 4. RLS 정책(요약)
- `recipes`
  - SELECT: `is_public = true` 또는 `user_id = auth.uid()`
  - INSERT: `user_id = auth.uid()`
  - UPDATE/DELETE: `user_id = auth.uid()`
- `recipe_favorites`
  - SELECT/INSERT/DELETE: `user_id = auth.uid()`
- `recipe_tags`
  - 레시피 소유자만 관리 가능

## 5. 주의 사항
- `ingredients`/`steps`는 검색 및 편집 편의성 면에서 초기 적합하나, 단일 필드 길이/쿼리 제약이 있으면 정규화가 필요
- 문자열 검색은 locale/공백/동의어 처리 필요 시 검색 인덱스 전략 추가
