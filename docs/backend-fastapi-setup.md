# Backend Setup (FastAPI + SQLite)

## 1. 개요
- 백엔드 프레임워크: FastAPI
- DB: SQLite (로컬 파일 DB)
- 인증: JWT + Bearer Token
- 기본 경로: `/api`

## 2. 폴더 구조
```text
backend/
  app/
    main.py
  data/
    recipes.db
  requirements.txt
```

## 3. 환경 변수
`backend/.env` (권장)
- `DATABASE_PATH=./data/recipes.db`
- `JWT_SECRET=change-me-very-strong`
- `FRONTEND_ORIGIN=http://localhost:3000`

## 4. 필수 패키지
- fastapi
- uvicorn[standard]
- python-jose[cryptography]
- passlib[bcrypt]

## 5. 설치
```bash
cd backend
pip install -r requirements.txt
```

## 6. 실행
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 7. 기본 동작
- 앱 시작 시 `DATABASE_PATH` 기준으로 SQLite 테이블이 생성됨
- 테이블:
  - `users` (회원)
  - `recipes` (레시피)
- 회원가입/로그인 후 JWT를 받으면, 레시피 API에 `Authorization: Bearer <token>`으로 전달

## 8. 확인 포인트
- `/api/health` 응답 `{"status":"ok"}`
- `/api/auth/register`와 `/api/auth/login` 동작
- 비회원은 `/api/recipes/public`만 조회 가능
- 본인 토큰으로 `/api/recipes`, `/api/recipes/me`, `/api/recipes/{id}` 수정/삭제 가능

