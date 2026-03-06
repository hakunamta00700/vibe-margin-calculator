# Supabase 설정 가이드 (개발/스테이징)

버전: v1.0  
작성일: 2026-03-06

## 1. 프로젝트 생성
- Supabase 프로젝트 생성
- Database → Region/플랜 선택
- Authentication 설정:
  - 이메일 로그인 활성화
  - Redirect URL 등록(개발/운영)
- Storage 버킷 생성
  - `recipe-covers` (public false)

## 2. 환경 변수
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (서버 전용)
- `NEXT_PUBLIC_APP_URL`

## 3. DB 반영 순서
1. `database-schema.md`의 SQL 실행
2. RLS 정책 SQL 적용
3. Storage bucket 정책 적용
4. 인덱스 검토 및 성능 확인

## 4. Auth 설정
- `redirectTo` URL에 재설정/콜백 주소 포함
- 비밀번호 최소 길이 정책 확인
- 세션 유지 정책(재로그인 간격) 정의

## 5. RLS 기본 정책(예시)
```sql
alter table public.recipes enable row level security;

create policy recipes_read on public.recipes
for select using (is_public = true or user_id = auth.uid());

create policy recipes_insert on public.recipes
for insert with check (user_id = auth.uid());

create policy recipes_update on public.recipes
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy recipes_delete on public.recipes
for delete using (user_id = auth.uid());
```

## 6. Storage 정책(요약)
- 업로드 정책: `user_id` 폴더에만 작성 허용(예: `/{user_id}/{uuid}.jpg`)
- 읽기 정책:
  - 공개 이미지는 공개 접근 허용
  - 비공개 이미지 또는 미공개 상태는 링크 생성 후 제어

## 7. 운영 점검
- Auth 이메일 템플릿 문구 확인(브랜드 컬러/문구)
- 로그 보존 정책 점검
- DB row level 보안 상태 점검
- API 키 분리(`anon`/`service role`)와 노출 점검
