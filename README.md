# Recipe Manager (Next.js + Supabase)

이 폴더에는 문서 + 앱 스켈레톤이 함께 있습니다.

## 1. 환경 변수
`.env.local`에 다음 값이 등록되어야 합니다.

- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (또는 `SUPABASE_ANON_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY` (서버 작업용, 선택)

오타 키 `SUPERBASE_*`는 코드에서 호환 처리했지만, 정식 운영에서는 `SUPABASE_*`로 통일 권장.

## 2. 시작
- `npm install`
- `npm run dev`
- 브라우저에서 `http://localhost:3000` 접속

## 3. 초기 DB
`data/001_init_recipes.sql`을 Supabase SQL Editor에서 실행해서 `recipes` 테이블과 RLS를 생성합니다.
