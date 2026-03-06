# API 명세서

버전: v1.1  
작성일: 2026-03-06  

## 1. 구현 규칙(확정)
- Next.js App Router의 Route Handler(`/app/api/**`)를 API 엔트리로 사용한다.
- 인증이 필요한 라우트는 서버에서 `supabase.auth.getUser()`로 확인 후 처리한다.
- 인증이 필요 없는 공개 라우트는 DB에서 `is_public = true` 조건만 조회한다.

## 2. 인증 API(상세)
### 2.1 회원가입
- Method: `POST /api/auth/sign-up`
- Body: `{ email, password }`
- Response: `{ user, session }`
- Error: `EMAIL_EXISTS`, `INVALID_EMAIL`, `WEAK_PASSWORD`

### 2.2 로그인
- Method: `POST /api/auth/sign-in`
- Body: `{ email, password }`
- Response: `{ user, session }`

### 2.3 로그아웃
- Method: `POST /api/auth/sign-out`
- Response: `{ success: true }`

### 2.4 비밀번호 재설정
- Method: `POST /api/auth/reset-password`
- Body: `{ email }`
- Response: `{ success: true }`

## 3. 레시피 API

### 3.1 목록 조회(로그인/비로그인 공용)
- Method: `GET /api/recipes`
- Query:
  - `q` (string, optional): 검색어(제목/재료)
  - `sort` (enum: `created_at|updated_at|title`, default `created_at`)
  - `order` (enum: `asc|desc`, default `desc`)
  - `category` (string, optional)
  - `is_public` (boolean, optional, default false for /recipes when logged in; true only when `open=true`)
  - `open` (boolean, optional): `true`면 비회원도 접근 가능한 공개 리스트 모드
  - `limit` (int, default 20 when `open=true`, default 50 when authenticated)
  - `offset` (int, default 0)
- Response:
  - 로그아웃 + `open=true`: 공개 레시피만 반환
  - 로그인: 본인 레시피 + 공개 조건을 포함한 확장 목록

### 3.2 레시피 생성
- Method: `POST /api/recipes`
- Auth: 필수
- Body:
  - `title` (required, string)
  - `description` (string)
  - `ingredients` (required, array/object)
  - `steps` (required, array/object)
  - `prep_time_min` (int)
  - `cook_time_min` (int)
  - `servings` (int)
  - `category` (string)
  - `tags` (array)
  - `is_public` (boolean)
  - `cover_image_url` (string)
- Validation:
  - 제목 required
  - 재료 최소 1개
  - 단계 최소 1개
- Response: `201` + created recipe

### 3.3 상세 조회
- Method: `GET /api/recipes/{id}`
- Auth: 선택
- Access rule:
  - 공개 레시피: 누구나 조회
  - 비공개 레시피: 소유자만 조회

### 3.4 수정
- Method: `PATCH /api/recipes/{id}`
- Auth: 소유자만
- Body: 부분 갱신
- Response: 갱신된 레시피

### 3.5 삭제
- Method: `DELETE /api/recipes/{id}`
- Auth: 소유자만
- Response: `{ success: true }`

### 3.6 공개 토글
- Method: `PATCH /api/recipes/{id}/publish`
- Auth: 소유자만
- Body: `{ is_public: true|false }`

### 3.7 공개 목록
- Method: `GET /api/recipes/public`
- Query: `q`, `sort`, `order`, `category`, `limit`, `offset`
- Response: 공개 레시피 목록(기본 최신순 limit=20)

### 3.8 계정 삭제 처리
- Method: `DELETE /api/account`
- Auth: 본인
- 동작:
  - 즉시 삭제 정책 적용: `recipes`, `favorites`, `tags` 연관 데이터 삭제
  - Storage에서 소유 이미지 정리

### 3.9 커버 이미지 업로드
- Method: `POST /api/recipes/{id}/cover`
- Auth: 소유자
- Body: `multipart/form-data` 파일
- Validation:
  - 타입: `image/jpeg`, `image/png`, `image/webp`
  - 크기: 5MB 이하

## 4. 에러 포맷
```json
{
  "error": {
    "code": "RECIPE_NOT_FOUND",
    "message": "요청한 레시피를 찾을 수 없습니다."
  }
}
```

## 5. 공통 응답 코드
- 200: 성공
- 201: 생성
- 400: 입력값 오류
- 401: 인증 실패
- 403: 권한 없음
- 404: 데이터 없음
- 409: 상태 충돌
- 413: 업로드 크기 초과
- 500: 서버 오류
