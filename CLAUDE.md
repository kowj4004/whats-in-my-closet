# What's in My Closet

개인 옷장 관리 웹앱. Node/Express 백엔드 + React/Vite 프론트엔드, JSON 파일 기반 저장(DB 서버 없음).
사용자가 하루에 한 번 정도 세션을 열어 기능을 조금씩 추가하며 발전시키는 프로젝트다. 매 세션마다
이 파일부터 읽고 시작하면 코드베이스를 처음부터 다시 탐색하지 않아도 된다.

## 서버 실행

가장 빠른 방법: `mcp__Claude_Browser__preview_start`를 `name: "dev"`로 호출한다
(`.claude/launch.json`에 등록되어 있음). 포트/충돌 처리를 도구가 알아서 한다.

수동으로 할 경우 루트에서 `npm run dev` (concurrently로 backend:4000 + frontend:5173 동시 실행).

- **backend는 `node --watch`**라 .js 저장 시 자동 재시작된다. 수동 재시작 불필요.
- **`.env` 변경은 자동 반영되지 않는다** — dotenv가 프로세스 시작 시 1회만 읽으므로, .env를 고쳤으면
  반드시 프로세스를 완전히 재시작해야 한다.
- **frontend는 Vite HMR**이라 대부분 저장 즉시 반영된다.
- 이미 떠 있는 서버를 두고 `npm run dev`를 새로 실행하면 `EADDRINUSE`가 난다. 재시작이 필요하면
  기존 프로세스를 먼저 확실히 종료(TaskStop 등)하고, 포트(4000/5173)가 비었는지 확인한 뒤 다시 켤 것.

## 아키텍처

```
backend/src/config/categories.json   카테고리 목록. 코드 수정 없이 이 파일만 편집하면
                                      카테고리 추가/변경/순서변경 가능. (현재: 상의/하의/악세사리/신발)
backend/src/db/*.js                  JSON 파일 기반 저장소. list/get/create/update/remove 인터페이스.
                                      clothesStore.js, outfitsStore.js
backend/src/routes/*.js              Express 라우터: categories, clothes, outfits, ai
backend/src/services/ai/             AI 기능 진입점(imageProcessor.js=배경정리, ocrExtractor.js=정보추출)
                                      + providers/(geminiProvider.js, noopProvider.js) — provider 교체 가능한 구조.
                                      resolveProvider()가 env(AI_IMAGE_PROVIDER/AI_OCR_PROVIDER)로 분기.
backend/data/*.json                  실제 데이터(git 추적 안 함). clothes.json, outfits.json
backend/uploads/                     업로드된 옷 사진 원본(git 추적 안 함)

frontend/src/pages/                  Home, CategoryView, ClothDetail, OutfitListView, OutfitDetail
frontend/src/components/             ClothCard/Grid, ManualEntryForm, CaptureOcrEntry(AI OCR),
                                      AddClothModal, OutfitBuilder/Modal/Card/Grid
frontend/src/api/client.js           백엔드 호출은 전부 이 파일을 통해서만 (fetch 직접 호출 금지)
```

**코디(outfit)는 일반 옷과 완전히 다른 데이터 모델이다.** 새 사진을 올리는 게 아니라, 이미 등록된
옷들의 id 배열(itemIds)만 저장한다. `/api/outfits`가 조회 시 각 id를 clothesStore에서 조회해
이미지 등 실제 정보를 채워서 응답한다(`routes/outfits.js`의 `withItems`). 옷 카테고리 시스템
(categories.json)에는 outfit이 포함되어 있지 않다 — 완전히 별도 라우트/페이지(`/outfits`)로 분리되어 있다.

## 알아둬야 할 이슈 / 히스토리

- **Gemini 이미지 생성 모델(`gemini-2.5-flash-image`)은 사용자의 무료 티어에서 할당량 0**
  (`limit: 0`, 429 에러) — 코드 문제가 아니라 Google 계정에 결제(Billing)가 연결 안 되어 있어서다.
  그래서 현재 `backend/.env`에 `AI_IMAGE_PROVIDER=noop`로 꺼두었다(옷사진 자동 배경정리/크롭 비활성).
  사용자가 결제를 연결하면 `gemini`로 바꾸기만 하면 다시 켜진다.
- **Gemini 텍스트 모델은 자주 deprecate된다.** 이미 한 번 `gemini-2.0-flash` → `gemini-3.6-flash`로
  교체했다(OCR 기능, `geminiProvider.js`의 `TEXT_MODEL`). 실패 시 에러 메시지에 Google이 권장하는
  대체 모델명이 그대로 나오니 그걸 반영하면 된다.
- PowerShell `Get-Content`로 한글이 든 JSON을 보면 인코딩이 깨져 보인다(파일 자체는 정상 UTF-8).
  한글 파일 내용 확인은 반드시 Read 툴로 할 것.
- API 키는 `backend/.env`에 있고 git에 커밋되지 않는다(.gitignore 처리됨). 재설치 후에는
  `backend/.env.example`을 복사해서 다시 채워야 한다.

## 새 기능 추가 워크플로우

1. 이 파일(CLAUDE.md)로 관련 위치 먼저 파악 — 전체 코드베이스 재탐색 최소화.
2. 백엔드 변경: `db/*Store.js`(데이터) → `routes/*.js`(API) → 필요시 `server.js`에 라우터 등록.
   node --watch가 자동 반영하므로 수동 재시작 불필요(.env를 건드렸을 때만 재시작).
3. 프론트 변경: `api/client.js`에 함수 추가 → 컴포넌트/페이지 작성 → 필요시 `App.jsx` 라우팅,
   `Home.jsx` 진입점, `styles/global.css`에 스타일 추가(CSS 변수는 `:root`에 이미 정의되어 있음).
4. 브라우저(Claude_Browser 도구)로 실제로 클릭해서 확인. **단, 이 브라우저 도구는 파일 업로드 다이얼로그를
   직접 조작할 수 없다** — 이미지 업로드가 필요한 흐름을 테스트해야 하면, 백엔드에 curl이나 간단한
   node 스크립트로 직접 multipart 요청을 보내서 검증한다(AI provider 함수를 직접 import해서 호출하는
   방법도 빠르다 — 이번 세션에서 `geminiRemoveBackground`/`geminiExtractInfo`를 그렇게 직접 테스트했다).
5. 완료되면 `git commit` — 하루 세션 단위로 커밋 하나씩 남기는 걸 기본으로 한다(사용자가 매일 조금씩
   발전시키길 원함). 커밋 전 `git status`/`git diff`로 실제 반영된 변경만 있는지 확인.

## 현재 구현된 기능 (2026-09-02 기준)

- 카테고리별 옷 등록/조회/수정/삭제 (상의/하의/악세사리/신발)
- 수동 입력 폼 + AI OCR 자동 입력(캡처 이미지에서 구매처/사이즈/가격/메모 추출) — 정상 작동
- AI 배경 정리(옷 사진 자동 크롭) — 코드는 구현되어 있으나 결제 미설정으로 현재 비활성 상태
- 코디(아웃핏): 이미 등록된 옷들을 카테고리별로 하나씩 골라 조합 → 생성/조회/수정/삭제

향후 변경 이력은 `git log`로 확인한다(세션마다 이 섹션을 계속 고쳐 쓰지 않는다).
