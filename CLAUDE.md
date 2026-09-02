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

## 다음 작업 (2026-09-03 예정): Gemini 의존도 제거 — "무료 자체 모델" 전환

사용자와 합의된 방향: 세 AI 기능 중 배경제거/합성은 애초에 생성형 AI가 필요 없는 작업이라 벤더
의존을 완전히 없애고, OCR도 대부분 무료로 전환한다. **자체 모델을 학습시키는 게 아니라 이미 공개된
오픈소스 사전학습 모델을 이 프로젝트 서버에서 직접 돌리는 방식**이다. Gemini는 정규식으로도 못 잡는
애매한 케이스에 한해 최소한으로만 폴백 유지.

1. **배경 제거/크롭** (`imageProcessor.js` / `geminiProvider.js`의 `geminiRemoveBackground` 대체)
   - `rembg`(U²-Net 기반 오픈소스, Python) 같은 사전학습 세그멘테이션 모델을 별도 프로세스/사이드카로
     돌리거나, 쇼핑몰 사진 특성상 배경이 거의 단색인 점을 이용해 OpenCV 계열 휴리스틱(GrabCut,
     가장자리 기준 배경색 flood-fill)으로 먼저 시도해볼 것. Python 의존성을 새로 들이는 게 부담이면
     Node 생태계 안에서 될 만한 대안(`sharp` + 휴리스틱)부터 검토.
   - 새 provider 파일(예: `providers/localImageProvider.js`)을 만들어 `resolveProvider()`에 `local`
     옵션 추가하는 기존 구조를 그대로 재사용하면 됨(routes/imageProcessor.js는 수정 불필요할 가능성 높음).
2. **코디 합성 이미지** (지금은 OutfitCard가 CSS grid로 여러 이미지를 나열만 함 — 실제 "한 장의 합성
   이미지"를 만드는 건 아직 구현 안 됨)
   - 서버 사이드 `sharp`로 여러 옷 이미지를 리사이즈/배치해 하나의 합성 이미지 파일로 생성 후 저장
     (코디 생성/수정 시점에 생성해서 캐시). AI 불필요, 순수 이미지 합성.
3. **OCR 정보 추출** (`ocrExtractor.js` / `geminiExtractInfo` 부분 대체)
   - Tesseract 기반으로 전환 검토(`tesseract.js` — 브라우저 WASM으로 클라이언트에서 돌리는 것도 가능,
     서버 호출·API 키 자체가 필요 없음). 뽑힌 텍스트에서 가격(`\d{1,3}(,\d{3})*원` 패턴 등)/사이즈
     같은 필드는 정규식으로 파싱.
   - Gemini(`geminiExtractInfo`)는 정규식 파싱이 실패했을 때만 호출하는 폴백으로 남겨두는 하이브리드
     구조 유지(완전 제거는 아님).

## 장기 로드맵: 로그인 + 실서비스 배포 (사용자가 "서비스 구상 완료되면" 진행하기로 보류함)

지금 당장 진행하지 않기로 함. 나중에 사용자가 요청하면 아래 세 가지 방향 중 골라서 시작:

- **A안(Supabase/Firebase 등 BaaS)**: 인증+DB+스토리지 통합 제공, 가장 빠르지만 백엔드 절반 리라이트.
- **B안(지금 구조 유지)**: Express·store 패턴은 그대로 두고 JSON 파일만 무료 Postgres(Supabase/Neon)나
  SQLite(Turso)로 교체 + 인증만 별도 추가(Clerk 등) + 이미지 Cloudflare R2. 지금까지 짠 코드 재사용률
  가장 높음 — 유력 후보.
- **C안(Cloudflare 풀스택)**: Pages+Workers+D1+R2. 무료 티어 가장 넉넉하고 콜드 슬립 없음, 대신
  Express를 못 그대로 올려서(Workers는 Node 런타임 아님) 라우팅 레이어 재작성 필요.

멀티유저가 되는 순간 Gemini API 키를 여러 사용자가 공유하는 구조는 못 버티므로, 배포 시점엔
"사용자별 API 키 입력" 또는 "운영자가 비용 부담"을 결정해야 함. 배경제거/합성을 위 로컬 모델 전환으로
끝내두면 이 시점에 남는 AI 비용 이슈는 OCR 폴백 정도로 최소화된다.

## 현재 공개 접속 상태

Cloudflare Quick Tunnel(무계정, 무료)로 임시 공개 URL을 발급해둔 적 있음(`frontend/vite.config.js`의
`server.allowedHosts: [".trycloudflare.com"]`가 그 흔적). 이 URL은 로그인 없이 전부 같은 데이터를
보는 데모용이며, PC/터널 프로세스가 꺼지면 죽고 다음에 다시 켜면 주소가 바뀐다. 정식 배포 전까지는
아무한테나 링크를 공유하지 않는다.
