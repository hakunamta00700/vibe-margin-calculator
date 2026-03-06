# FastAPI + Next.js 개발 체크리스트

## 0. 사전 준비
- Python 3.11+ 설치
- Node.js 18+ 설치
- SQLite 파일 경로 쓰기 권한 확인

## 1. 백엔드
- [ ] `backend/requirements.txt` 설치
- [ ] `backend/.env` 작성
- [ ] `uvicorn app.main:app --reload --port 8000` 실행
- [ ] `/api/health` 확인
- [ ] `/api/auth/register`로 테스트 계정 생성
- [ ] `/api/auth/login` 토큰 발급 확인
- [ ] `/api/recipes` 등록/조회/수정/삭제 동작 확인

## 2. 프론트엔드
- [ ] `frontend/.env.local`에 `NEXT_PUBLIC_API_BASE_URL` 지정
- [ ] `npm install`, `npm run dev`
- [ ] `/login`에서 회원가입/로그인 후 토큰 저장
- [ ] 내 레시피 목록 로드
- [ ] 레시피 등록 후 목록 반영
- [ ] 상세/수정/삭제 기능 동작 확인

## 3. 보안 체크
- [ ] `JWT_SECRET` 비밀 관리
- [ ] 비밀번호 해시 처리 확인
- [ ] 비공개 레시피가 본인만 조회되는지 확인
- [ ] 공개 레시피 검색에서 비로그인 조회만 허용되는지 확인

## 4. 배포 전 점검
- [ ] CORS origin 정확성 (`FRONTEND_ORIGIN`)
- [ ] DB 백업/파일 권한/경로 점검
- [ ] 예외 응답 메시지 스펙 정합

