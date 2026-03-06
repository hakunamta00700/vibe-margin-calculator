# 베이커리 원가·마진 계산기 분석

## 프로그램 개요

- `index.html`은 단일 HTML 파일로 동작하는 **클라이언트 사이드 웹 앱**이다.
- 주요 목적은 빵 레시피 기준으로 재료비·총원가·개당원가·이익률을 계산하고, 레시피를 저장/복원하며, 쿠팡 링크 기반으로 재료 구매를 연계하는 것이다.
- `localStorage`를 이용해 사용자 데이터(재료 DB, 레시피)를 브라우저에 영구 저장한다.

## 사용자 기능

- 기본 입력: 제품명, 생산수량, 개당 판매가, 기타비(인건비+고정비).
- 레시피 이름 관리: 레시피 저장/불러오기/삭제.
- 레시피 행 편집: 재료명 검색(참조), 직접 구매가/총중량 입력, 사용량 입력, 행 삭제.
- 계산 KPI 표시:
  - 재료비 합계
  - 총원가
  - 개당원가
  - 개당이익
  - 마진율(원가기준), 이익률(매출기준), 손익분기점 수량, 목표이익 기준 필요 판매가
- 관리 영역(접기/펼치기): 재료 추가 및 재료 DB 관리.
- 복사 기능: 요약 텍스트 복사, 재료 CSV 복사.

## 핵심 동작 흐름

- 화면 조작 시 `calc()`가 재계산되어 KPI를 실시간 갱신한다.
- 레시피 행에서는 재료명으로 DB 항목을 찾아 DB 단가를 가져오고, 직접입력 단가가 있으면 직접단가를 우선 적용한다.
- 목표이익/판매가는 `targetPrice = (총원가 + 목표이익)/생산수량` 공식으로 계산한다.
- 저장된 레시피는 `localStorage`의 JSON 객체에 레시피명 키로 보관한다.

## 데이터 구조 및 저장

- 상수 키:
  - `KEY_M = 'bakery_v4_materials'` (재료 DB)
  - `KEY_R = 'bakery_v4_recipes'` (레시피)
- 초기 재료 DB(`defaultMaterials`)가 내장되어 있으며, 최초 실행 시 로컬 스토리지에 없으면 자동 저장한다.
- 각 재료는 `{id, name, price, weight, coupangLink}` 형태를 사용한다.
- 각 레시피 행은 `{materialId, materialName, amount, customPrice, customWeight}` 형태를 레시피 본문으로 저장한다.

## 계산 규칙

- 재료 단가: `pricePerGram = price / weight`.
- 행 단위 투입원가: `appliedUnitCost * usedAmount`, 여기서 적용 단가는 DB 단가 또는 직접단가(직접입력 가격/중량) 중 큰 우선순위로 직접단가 우선 적용.
- 전체 재료비 = 모든 행 투입원가 합계.
- 총원가 = 재료비 + 기타비.
- 개당원가 = 총원가 / 생산수량.
- 개당이익 = 개당판매가 - 개당원가.
- 마진율(원가기준) = 개당이익 / 개당원가, 이익률(매출기준) = 개당이익 / 개당판매가.
- 손익분기점 수량 = `ceil(기타비 / (판매가 - 단위재료비))`, 분모가 0이면 계산불가 처리.

## 기술 스택/구조

- UI/스타일(CSS), 로직, 렌더링, 상태관리 모두 `index.html` 내 단일 `<script>`에 몰아넣은 구조.
- 외부 라이브러리 미사용 순수 바닐라 JS, 순수 HTML/CSS.
- 서버 API, 백엔드, 빌드 파이프라인 없음.

## 결론

- 이 파일은 **베이커리 레시피 기반 원가·마진 계산기 웹 앱**이며, 쿠팡 상품 링크가 포함된 재료 DB와 로컬 저장형 레시피 관리 기능을 결합한 단일 페이지 구현이다.

## 함수별 책임 정리

- `getMaterials`/`setMaterials`: 로컬 재료 DB 읽기/쓰기.
- `renderMaterialTable`: 재료 DB 목록 렌더링 및 삭제 버튼 바인딩.
- `bindMaterialAdd`: 재료 관리자 입력 이벤트 바인딩, 등록/초기화.
- `refreshMaterialDatalist`: 재료 검색용 `<datalist>` 동기화.
- `rowHtml`: 레시피 행 템플릿 생성.
- `addRecipeRow`: 행 추가, 입력 이벤트 바인딩, 재료 동기화 호출.
- `syncRowMaterial`: 행의 재료명 기준으로 DB 단가/링크 자동 반영.
- `getRecipeRows`: 현재 행 데이터를 직렬화해 저장/복원 용도로 가공.
- `calc`: 모든 행 비용 계산 + KPI 산출 + 화면 표시 갱신.
- `loadRecipesList`: 레시피 목록 select 옵션 갱신.
- `saveRecipe` / `loadRecipe` / `deleteRecipe`: 레시피 CRUD.
- `copyText`, `copySummaryBtn`, `copyRowsBtn`: 클립보드 복사 기능.
- `applyTargetBtn`: 목표이익 기반 판매가 반영.

## 데이터 흐름 요약

1. 재료명 입력 시 `syncRowMaterial`로 DB 단가/링크를 반영.
2. 입력 변경이 발생하면 `calc` 호출로 행 단가(`DB/직접/적용`), 투입원가, KPI를 즉시 갱신.
3. `calc` 산출 값은 저장 로직(`saveRecipe`)과 복사 기능에서 재사용.
4. 레시피 로드 시 행 구성 및 계산 상태를 복원.

## 리스크/개선 포인트

- `defaultMaterials`에 외부 URL이 다수 포함되어 있어, 데이터 용량이 커지면 초기 로딩 성능 저하 가능.
- `replaceAll` 사용으로 구형 브라우저 호환성 제약.
- `localStorage` 직렬화 크기 제한(보통 5\~10MB)로 재료/레시피가 과다 누적 시 저장 실패 가능.
- 현재 입력 값 검증이 단순수준이라 음수/이상치 입력에 대한 강건성 보완 여지.
- `material`의 키가 이름 매칭이라 이름 중복 시 잘못 매핑될 수 있음(고유키 기반 조회 보완 권장).

## 사용자 시나리오 테스트 체크리스트

- 기본 사용
  - 제품명/생산수량/판매가/기타비 입력 후 기본 1개 행 추가로 KPI가 즉시 갱신되는지 확인.
  - `재료 선택`에 재료명을 입력해 쿠팡 링크와 DB단가가 자동 반영되는지 확인.
  - 직접 구매가/총중량 입력 시 직접단가가 우선 반영되는지 확인.
- 레시피 사용성
  - 레시피명을 입력하고 행 구성 후 저장 → 목록 표시 → 선택 후 불러오기로 동일 값 복원이 되는지 확인.
  - 저장된 레시피 삭제 시 select 옵션에서 즉시 제거되는지 확인.
  - 빈 레시피명/미선택 상태에서 저장/불러오기/삭제 동작 메시지 확인.
- 재료 DB 관리
  - 관리자 섹션에서 재료 추가 후 다이얼리스트에 즉시 반영되는지 확인.
  - 재료 삭제 후 해당 재료가 레시피 행 동기화에 반영되는지(없는 재료는 직접단가 기반 처리) 확인.
- 계산 경계값
  - 생산수량 0 또는 음수 입력 시 최소치 처리 확인(현재는 최소1 처리).
  - 판매가 0일 때 이익률/마진 계산의 안전성, 분모가 0인 경우 표현 확인.
  - 손익분기점이 음수/무한대가 되는 케이스에서 표시 메시지 확인.
- 클립보드 기능
  - 요약 복사 결과에 KPI 라인 9개가 포함되는지.
  - CSV 복사 시 `,`가 포함된 재료명에서 구분 오류가 생기지 않는지 확인(현재 공백 치환 동작 점검).
- 호환성/회복
  - 새 브라우저/새 기기에서 `localStorage` 미존재 상태일 때 기본 재료 DB가 정상 초기화되는지 확인.
  - 대량 행(예: 50개 이상)에서 반응성 및 입력 반응 속도 확인.

## 함수/컴포넌트 의존도 다이어그램(텍스트)

- 초기화 체인
  - `init`(문서 하단 실행부)
    - `localStorage(KEY_M) 존재 여부` -&gt; `setMaterials(defaultMaterials)`
    - `renderMaterialTable` -&gt; `refreshMaterialDatalist`
    - `addRecipeRow`(최소 1개 행)
    - `loadRecipesList`
    - `formatMoneyInput` (`sellPrice`, `etcCost`, `targetProfit`)
    - `calc`
- 계산/표시 경로
  - `addRecipeRow` -&gt; `syncRowMaterial` -&gt; (`matName` 입력 이벤트)
  - `row 입력 이벤트(input/blur)` -&gt; `syncRowMaterial`/`calc`
  - `calc`
    - 행 순회(`#rows tr`) -&gt; `getMaterials` -&gt; `pricePerGram`
    - 행별 `appliedUnitCost` 산출 후 KPI 갱신
    - KPI UI 업데이트(`matTotal`, `totalCost`, `unitCost`, ...)
- 저장/복원 경로
  - `saveRecipe` -&gt; `getRecipeRows` -&gt; `localStorage(KEY_R)`
  - `loadRecipesList` -&gt; select 렌더링
  - `loadRecipe` -&gt; 폼/행 채움 -&gt; `addRecipeRow` 재사용 -&gt; `calc`
- 관리자 경로
  - `bindMaterialAdd`
    - `addMaterialBtn` -&gt; `setMaterials`/`renderMaterialTable`/`refreshMaterialDatalist`
    - 행 삭제 버튼(`#materialRows`) -&gt; `setMaterials` 재저장 -&gt; `renderMaterialTable`
- 복사 경로
  - `copySummaryBtn` -&gt; KPI DOM 취합 -&gt; `copyText`
  - `copyRowsBtn` -&gt; 행 DOM 취합(CSV 헤더+행) -&gt; `copyText`
- 목표가격 경로
  - `calc`로 계산된 `targetPrice` 표시 -&gt; `applyTargetBtn` -&gt; `sellPrice` 갱신 -&gt; `calc`

## UI/비즈니스 로직 분리 제안(개선안)

- 권장 목표: `index.html` 단일 파일 구조에서 `src/` 분리
  - `src/main.js`: 초기화, DOM 이벤트 바인딩, 상태 조정, 렌더링 호출
  - `src/calculation.js`: `parseMoney`, 단가 계산, KPI 계산, 브레이크이븐/목표판매가 계산
  - `src/storage.js`: `localStorage` 조회/저장 래퍼(버전, 마이그레이션, 에러 처리)
  - `src/material.js`: 재료 목록 CRUD, 가격 계산, 검색 후보 제공
  - `src/recipe.js`: 레시피 CRUD/직렬화/검증
  - `styles.css`: 스타일 분리
- 1차 리팩터링(안전한 단계)
  - 1단계: 계산/저장 로직만 모듈 분리(동작 불변)
  - 2단계: 렌더링 함수 분리(테이블/카드 렌더러)
  - 3단계: 이벤트 핸들러를 의도된 엔트리 포인트(`handleAddRow`, `handleSaveRecipe` 등)로 정리
  - 4단계: 상수/키/기본값 설정 분리(`config.js`)
- 부수 효과
  - 테스트 가능성이 크게 높아지고, 특정 기능의 회귀 수정이 쉬워지며, 대용량 데이터 처리 시 성능 개선 포인트 파악이 쉬워짐.