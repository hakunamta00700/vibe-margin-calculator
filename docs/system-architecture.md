# 시스템 아키텍처 문서

버전: v1.0  
작성일: 2026-03-06

## 1. 아키텍처 개요
- 웹 앱: Next.js(App Router) + React
- 인증: Supabase Auth
- 영구 저장소: Supabase Postgres
- 파일: Supabase Storage
- 배포: Vercel 권장(또는 자체 배포)

## 2. 핵심 컴포넌트
1. **Next.js Frontend**
   - 페이지: 랜딩, 인증, 내 레시피 대시보드, 작성/수정/상세
   - 상태: `auth`, `recipe list`, `recipe form`
2. **Supabase Client Layer**
   - 브라우저 전용 클라이언트: 인증 상태 조회, 인증 흐름 API 호출
   - 서버 액션/Route Handler: 민감 작업(레시피 CRUD)의 신뢰성 강화
3. **Supabase Backend**
   - Auth: 사용자 인증/토큰 발급
   - Postgres: 레시피 데이터 저장
   - Storage: 이미지 저장소
   - RLS: 데이터 격리 보안 강제

## 3. 요청 흐름
- 로그인 요청: 브라우저 -> Supabase Auth -> 세션 쿠키/토큰 갱신
- 레시피 목록 요청: Next.js Server Action -> Supabase PostgREST -> Postgres (`RLS` 적용)
- 레시피 작성/수정: Server Action/라우트 -> 입력 검증 -> Supabase DB 반영
- 공개 조회 요청: 익명/비로그인 허용 경로 -> `is_public` 조건 만족 시 조회

## 4. 인증/권한 전략
- 모든 인증 상태는 `@supabase/ssr` 기반 쿠키 세션으로 관리
- 클라이언트와 서버 모두에서 `user_id = auth.uid()` 전제 검증
- UI는 기능 노출/숨김을 위한 보조 정책, **최종 접근 제어는 DB의 RLS**

## 5. 에러 처리 전략
- 인증 에러: 인증 화면으로 라우팅 또는 토스트 알림
- 권한 에러: “조회/수정 권한이 없습니다.” 메시지
- 데이터 에러: 재시도 버튼 + 사용자 행동 가이드(저장 버튼 비활성화, 로딩 표시)

## 6. 확장 포인트
- v1.1: 태그 별도 정규화 및 검색 API 고도화
- v1.2: 이미지 CDN 변환, 썸네일 자동 생성
- v2.0: 커뮤니티 피드, 댓글/평점, 레시피 복제
