# FastAPI API 명세서 (v1)

## Base URL
`http://localhost:8000/api`

## 인증 규칙
- 인증 헤더: `Authorization: Bearer <access_token>`
- 토큰 획득: `/auth/login`, `/auth/register`

## 1) Auth
### POST `/auth/register`
- 설명: 회원가입
- 요청
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- 응답
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

### POST `/auth/login`
- 설명: 로그인
- 요청/응답: `register`와 동일

## 2) 레시피
### GET `/recipes/public`
- 설명: 공개 레시피 목록
- 쿼리:
  - `q` (선택): 검색어
  - `category` (선택)
  - `sort`: `created_at | updated_at | title`
  - `order`: `asc | desc`
  - `limit`: 기본 20, 최대 100
  - `offset`: 기본 0

### GET `/recipes/me`
- 설명: 로그인 사용자의 레시피 목록
- 인증 필요

### GET `/recipes/{id}`
- 설명: 레시피 단건 조회
- 인증 필요, 다만 공개 레시피는 로그인 사용자도 조회 가능

### POST `/recipes`
- 설명: 레시피 등록
- 인증 필요
- 예시
```json
{
  "title": "카레",
  "description": "매콤한 카레",
  "ingredients": [{"name":"양파","amount":"1개"}],
  "steps": [{"order":1,"text":"..." }],
  "prep_time_min": 10,
  "cook_time_min": 25,
  "servings": 2,
  "category": "한식",
  "is_public": true
}
```

### PATCH `/recipes/{id}`
- 설명: 레시피 수정(부분 업데이트)
- 인증 필요(소유자만)

### DELETE `/recipes/{id}`
- 설명: 레시피 삭제
- 인증 필요(소유자만)

## 에러 코드
- `400`: 입력값 오류
- `401`: 인증 실패/토큰 오류
- `403`: 소유자 아님
- `404`: 대상 없음

