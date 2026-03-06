# 개발 전 문서 완성 체크리스트 (Master Index)

버전: v1.1  
작성일: 2026-03-06  

## 1. 현재 문서
- [요구사항] `requirements.md`
- [기능 명세] `features.md`
- [유저 시나리오] `user-scenarios.md`
- [테스트케이스] `test-cases.md`
- [논리 정합성 리뷰] `logic-consistency-review.md`
- [DB 설계] `database-schema.md`
- [시스템 아키텍처] `system-architecture.md`
- [API 계약] `api-spec.md`
- [Supabase 설정] `supabase-setup.md`
- [개발 계획] `development-plan.md`
- [QA 준비] `qa-readiness.md`

## 2. 문서 커버리지
- 요구사항: `requirements.md`
- 기능: `features.md`
- 시나리오: `user-scenarios.md`
- 테스트: `test-cases.md`
- 정합성: `logic-consistency-review.md`
- 구현: `system-architecture.md`, `database-schema.md`, `api-spec.md`, `supabase-setup.md`
- 실행: `development-plan.md`, `qa-readiness.md`

## 3. 결정된 고정사항
- 회원 탈퇴 정책: 레시피/이미지/연결 데이터 즉시 삭제
- 비회원 공개 범위: 공개 상세 + 공개 목록(기본 최신순 20개) + 공개 검색 허용
- API 구현 방식: Route Handler 단일 방식

## 4. 개발 착수 승인 기준
- 결정된 고정사항이 `requirements.md`와 `api-spec.md`에 반영됨
- `logic-consistency-review.md`의 Medium/High 이슈가 해소되었고,
- `qa-readiness.md`의 필수 통과군이 문서로 정의됨
