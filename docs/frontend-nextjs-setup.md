# Frontend Setup (React + Next.js)

## 1. 목표
- Next.js 14 App Router 사용
- 백엔드(FastAPI) API를 호출해 로그인/레시피 CRUD 처리

## 2. 폴더 구조
```text
frontend/
  src/
    app/
      page.tsx
      layout.tsx
      login/page.tsx
      dashboard/page.tsx
      recipes/new/page.tsx
  public/
  package.json
  next.config.mjs
```

## 3. 환경 변수
`frontend/.env.local`
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

## 4. 설치
```bash
cd frontend
npm install
```

## 5. 실행
```bash
npm run dev
```
브라우저: `http://localhost:3000`

## 6. API 연동 규칙
- 로그인/회원가입 API
  - `POST /auth/register`
  - `POST /auth/login`
- 레시피 API
  - `GET /recipes/public`
  - `GET /recipes/me`
  - `POST /recipes`
  - `PATCH /recipes/{id}`
  - `DELETE /recipes/{id}`
- 인증 헤더
  - `Authorization: Bearer <access_token>`

## 7. 인증 상태 관리
- 토큰은 브라우저 `localStorage`에 보관(프로토타입 기준)
- 요청 전 `Authorization` 헤더에 토큰 삽입
- 401 응답 시 `/login`으로 이동

## 8. 개발 체크
- `NEXT_PUBLIC_API_BASE_URL` 오타 확인
- 토큰 유효시간 만료 시 재로그인
- 폼 입력 값이 빈 값이 아닌지 유효성 검사

