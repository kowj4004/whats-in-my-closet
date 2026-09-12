# What's in My Closet

개인 옷장 관리 웹앱. Node/Express 백엔드 + React/Vite 프론트엔드. 저장소는 `DATABASE_URL`이 있으면
Postgres(Supabase), 없으면 로컬 JSON 파일(개발용 기본값).
사용자가 하루에 한 번 정도 세션을 열어 기능을 조금씩 추가하며 발전시키는 프로젝트다. 매 세션마다
이 파일부터 읽고 시작하면 코드베이스를 처음부터 다시 탐색하지 않아도 된다.

GitHub: https://github.com/kowj4004/whats-in-my-closet (public, origin으로 연결되어 있음).
`git push`는 매 세션 커밋 후 자동으로 하지 않는다 — 사용자가 명시적으로 요청했을 때만 push한다.

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
backend/src/db/clothesStore.js       스위처. DATABASE_URL 있으면 pgClothesStore, 없으면 jsonClothesStore로
backend/src/db/outfitsStore.js       위임한다(둘 다 동일한 list/get/create/update/remove 인터페이스).
backend/src/db/pg*.js                Postgres(Supabase) 구현. postgresPool.js가 연결 풀, migrate.js가
                                      테이블 생성(서버 시작 시 자동 실행).
backend/src/db/json*.js              로컬 파일 기반 구현(기존 방식, 개발 편의용 기본값).
backend/scripts/migrate-json-to-postgres.js   JSON→Postgres 1회성 데이터 이전 스크립트(id 보존).
backend/src/routes/*.js              Express 라우터: categories, clothes, outfits, ai
backend/src/services/ai/             AI 기능 진입점(imageProcessor.js=배경정리, ocrExtractor.js=정보추출)
                                      + providers/(geminiProvider.js, noopProvider.js) — provider 교체 가능한 구조.
                                      resolveProvider()가 env(AI_IMAGE_PROVIDER/AI_OCR_PROVIDER)로 분기.
backend/data/*.json                  실제 데이터(git 추적 안 함). clothes.json, outfits.json
backend/uploads/                     업로드된 옷 사진 원본(git 추적 안 함)

frontend/src/pages/                  Home, CategoryView, ClothDetail, OutfitListView, OutfitDetail, Login
frontend/src/components/             ClothCard/Grid, ManualEntryForm, CaptureOcrEntry(AI OCR),
                                      AddClothModal, OutfitBuilder/Modal/Card/Grid
frontend/src/auth/                   AuthContext.jsx(로그인 상태 전역 관리) + ProtectedRoute.jsx
frontend/src/lib/supabaseClient.js   프론트용 Supabase 클라이언트(anon 키, 로그인 전용 — 데이터는 여전히
                                      /api/...를 거침)
frontend/src/api/client.js           백엔드 호출은 전부 이 파일을 통해서만 (fetch 직접 호출 금지).
                                      모든 요청에 authFetch()가 Supabase 세션 토큰을 자동으로 붙인다.
```

**코디(outfit)는 일반 옷과 완전히 다른 데이터 모델이다.** 새 사진을 올리는 게 아니라, 이미 등록된
옷들의 id 배열(itemIds)만 저장한다. `/api/outfits`가 조회 시 각 id를 clothesStore에서 조회해
이미지 등 실제 정보를 채워서 응답한다(`routes/outfits.js`의 `withItems`). 옷 카테고리 시스템
(categories.json)에는 outfit이 포함되어 있지 않다 — 완전히 별도 라우트/페이지(`/outfits`)로 분리되어 있다.

## 로그인 (Supabase Auth, 2026-09-11 도입)

**컨셉**: 지금은 개인용 도구지만, 궁극적으로는 자기 옷장을 남에게 공개/게시하는 SNS적 성격을 
지향한다. 그래서 로그인을 "일단 막기용"이 아니라 "소유권(user_id) + 공개여부(is_public)"가 
처음부터 데이터에 붙어있는 구조로 만들었다 — 나중에 공개 피드를 만들 때 스키마를 다시 안 바꿔도 되게.

- **인증 제공자**: Supabase Auth(이메일/비밀번호). 이미 DB/Storage로 Supabase를 쓰고 있어서
  추가 벤더 없이 자연스럽게 확장됨. `frontend/src/lib/supabaseClient.js`가 `VITE_SUPABASE_URL`/
  `VITE_SUPABASE_ANON_KEY`(프론트 `.env`, git 추적 안 함)로 만든 클라이언트 — 로그인/세션 관리만
  담당하고, 실제 옷/코디 데이터는 여전히 백엔드 `/api/...`를 거친다(Supabase에 직접 쓰지 않음).
- **프론트**: `AuthContext`(세션 상태 전역) + `ProtectedRoute`(비로그인 시 `/login`으로 리다이렉트).
  `App.jsx`의 모든 페이지 라우트가 `ProtectedRoute`로 감싸져 있다(`/login` 제외).
  `api/client.js`의 `authFetch()`가 매 요청마다 `supabase.auth.getSession()`으로 현재 토큰을
  가져와 `Authorization: Bearer <token>` 헤더에 자동으로 붙인다 — 컴포넌트가 토큰을 직접 다룰 필요 없음.
- **백엔드**: `middleware/auth.js`의 `requireAuth`가 토큰을 Supabase에 검증 요청(`auth.getUser`)해서
  `req.userId`를 채운다. `routes/clothes.js`, `routes/outfits.js`, `routes/ai.js` 전부
  `router.use(requireAuth)`로 보호되어 있다(`categories`는 정적 설정이라 예외). `pgClothesStore.js`/
  `pgOutfitsStore.js`의 모든 함수가 `userId`를 받아 `WHERE user_id = $userId`로 스코프한다 —
  다른 사람 데이터는 애초에 쿼리 결과에 안 잡힌다.
- **DB 스키마**: `clothes`/`outfits`에 `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE`,
  `is_public BOOLEAN DEFAULT false` 추가(`migrate.js`). RLS도 켜뒀고(`is_public = true`인 행만
  공개 SELECT 허용하는 정책) — 지금의 Express 백엔드(postgres 역할)에는 영향 없지만, 나중에
  프론트가 Supabase를 직접 읽는 공개 피드를 만들 때를 대비한 사전 준비. `is_public`은 지금
  라우트에서 실제로 쓰이진 않음(전부 기본 비공개) — 공개/게시 기능 자체는 아직 미구현.
- **기존 데이터 귀속 완료.** 로그인 전 데이터(옷 3개, 코디 1개)는 처음엔 `kowj4004@naver.com` 계정에
  붙였다가, 사용자가 주 계정을 `kowj4004@gmail.com`으로 정하면서 그쪽으로 다시 옮겼다. naver 계정은
  빈 채로 삭제함. **지금부터는 `kowj4004@gmail.com`이 유일한/주 계정이다.**
- **배포**: Render 환경변수에 `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` 이미 추가되어 있음(Vite는
  빌드 타임에 값을 번들에 박아넣으므로, 새 프론트 env 변수를 추가하면 Render에도 반영해야 함).
- **커스텀 SMTP 연결 완료(Brevo)**: Supabase 기본 메일 발송기는 무료 티어 한도가 매우 낮아
  (시간당 몇 통 수준, 프로젝트 전체 공용 한도) 테스트 중 자주 막혔다. Brevo 무료 SMTP로 교체함
  (Supabase 대시보드 `/settings/auth` → SMTP Settings). **주의**: Brevo의 SMTP Username은 계정
  이메일이 아니라 Brevo가 별도로 발급하는 `xxxxxxx@smtp-brevo.com` 형태의 값이다(SMTP & API 페이지에서
  확인) — 계정 이메일을 Username에 넣으면 로그도 안 남기고 조용히 실패한다(Supabase 에러는
  "Error sending recovery email"로만 뜸). 발신자 이메일(Sender email)은 naver.com 같은 프리메일
  도메인은 DMARC 경고가 떠서 실패 가능성이 있어 `kowj4004@g.skku.edu`(학교 메일, DMARC 정상)로 설정함.

## 카테고리 커스터마이징 (2026-09-12 도입)

전역 `categories.json`(모두가 공유하는 상의/하의/악세사리/신발 4개 고정) 방식을 완전히 버리고,
사용자마다 자기 카테고리를 이름 변경/추가/삭제하고 사진을 넣고 세부카테고리(2단계까지)를 만들 수
있게 DB 기반으로 바꿨다.

- **스키마**: `categories` 테이블 하나로 최상위/세부카테고리를 둘 다 표현한다 — 세부카테고리는
  그냥 `parent_id`가 채워진 category row일 뿐, 별도 테이블이 아니다(`pgCategoriesStore.js`).
  `clothes.category_id`가 이 테이블을 가리킨다(예전의 `category` TEXT 컬럼은 제거함). 새 계정은
  `GET /api/categories` 호출 시 카테고리가 0개면 기본 4개(상의/하의/악세사리/신발)를 자동으로
  만들어준다(`ensureDefaultCategories`).
- **옷 목록 조회**: `GET /api/clothes?categoryId=X`를 최상위 카테고리로 호출하면 그 세부카테고리에
  속한 옷들도 같이 보여준다(`getCategoryIdsIncludingChildren`으로 자기+자식 id를 모아서 필터).
  세부카테고리 id로 직접 호출하면 그 세부카테고리 것만 나온다.
- **카테고리 삭제**: 자신 또는 세부카테고리에 옷이 하나라도 있으면 막는다(먼저 옷을 옮기거나
  지워야 함) — 데이터 유실 방지.
- **프론트**: `CategoryFormModal`(카테고리/세부카테고리 생성·수정 공용) 하나로 Home(최상위)과
  CategoryView(세부카테고리) 양쪽에서 재사용. `CategoryView`의 세부카테고리 칩("전체" + 각 이름)은
  API를 다시 안 부르고 이미 받아온 옷 목록을 클라이언트에서 필터링한다. 옷 등록 시 세부카테고리가
  있으면 `ManualEntryForm`에 카테고리 선택 `<select>`가 자동으로 뜬다(`categoryChoices` prop).
- 기존 데이터(옷 3개)는 `scripts/migrate-categories-to-db.js`로 옛 문자열(top/bottom 등)을 새
  카테고리 행에 매핑해서 이전 완료.

## 옷장 공유(열람 전용) (2026-09-12 도입)

"SNS적 성격" 컨셉의 첫 조각. 로그인한 사람이 **다른 사람의 이메일을 알면** 그 사람이 공유를
켜뒀을 때 옷장을 볼 수 있다 — 단, 완전 공개 인터넷 노출이 아니라 자기도 로그인은 돼 있어야 하고,
상대 데이터는 절대 수정/삭제할 수 없다(그런 엔드포인트 자체가 없음, 구조적으로 불가능).

- **DB**: `user_settings` 테이블(user_id PK, `sharing_enabled` bool, 기본 false).
- **백엔드**: `routes/settings.js`(GET/PUT, 본인 설정만) + `routes/shared.js`(GET `/api/shared/:email`
  하나뿐 — **쓰기 라우트가 아예 없다**는 게 "열람만 가능"의 실제 보장 수단). 이메일로
  `auth.users`에서 대상 user_id를 찾고(우리 Postgres 연결이 postgres 역할이라 auth 스키마도
  바로 조회 가능), `sharing_enabled`가 꺼져 있거나 이메일이 존재하지 않으면 **둘 다 같은 404**를
  준다(이메일 존재 여부를 추측하지 못하게). 켜져 있으면 그 사람의 categories/clothes/outfits를
  기존 store 함수에 대상 userId를 넘겨서 그대로 재사용해 반환한다.
- **프론트**: `Settings.jsx`(공유 on/off 토글 + 이메일로 남의 옷장 보러가기 입력창),
  `SharedCloset.jsx`(카테고리별로 그룹된 읽기 전용 그리드 — 일부러 `<Link>`가 아니라 `<div>`라
  클릭해서 상세/수정 화면으로 못 들어간다). 헤더에 "설정" 링크 추가.
- 실제 계정으로 토글 on/off, 존재하지 않는 이메일, 공유 꺼진 상태, 쓰기 시도(404 확인) 전부
  API로 검증 후 UI로도 재확인함. **테스트하면서 `kowj4004@gmail.com` 계정의 공유를 켜둔 채로
  마쳤다** — 원치 않으면 `/settings`에서 끌 것.

## 알아둬야 할 이슈 / 히스토리

- **[로컬 개발 전용, 2026-09-12] Express 서버 안에서 AI 배경제거(`@imgly/background-removal-node`)를
  돌리면 이 Windows 개발 환경에서 네이티브 크래시가 난다** (`GLib-GObject-CRITICAL: invalid unclassed
  type`로 시작해서 서버 프로세스가 죽음). 같은 함수를 `node -e`로 standalone 실행하면 멀쩡하고,
  `AI_IMAGE_PROVIDER=noop`으로 두면 서버도 정상 동작한다 — 즉 Express 요청 컨텍스트(멀티파트
  업로드 + sharp + onnxruntime 조합) 안에서만 재현된다. Render는 Linux라 영향 없을 가능성이 높고
  실제로 프로덕션에서는 계속 정상 동작해왔다. **원인 미확정** — 오늘 새로 설치한 `pg`/`nodemailer`
  같은 네이티브 의존성과의 DLL 충돌이 의심되지만 확인 전. 지금 로컬 `.env`는 `AI_IMAGE_PROVIDER=noop`로
  임시 전환해둔 상태 — 다음 세션에서 원인 조사하거나, 급하지 않으면 그냥 이 상태로 로컬 개발 계속해도 됨
  (실제 배포본 `.env`/Render 환경변수는 안 건드렸으니 프로덕션은 여전히 `local`).
- Gemini 이미지 생성 모델(`gemini-2.5-flash-image`)은 무료 티어 할당량 0 문제로 결국 로컬 오픈소스
  모델로 완전히 대체했다(아래 "Gemini 의존도 제거" 절 참고). `AI_IMAGE_PROVIDER=local`이 현재 기본값.
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

## 현재 구현된 기능 (2026-09-03 기준)

- 카테고리별 옷 등록/조회/수정/삭제 (상의/하의/악세사리/신발)
- 수동 입력 폼 + AI OCR 자동 입력(캡처 이미지에서 구매처/사이즈/가격/메모 추출)
- AI 배경 정리(옷 사진 자동 크롭)
- 코디(아웃핏): 이미 등록된 옷들을 카테고리별로 하나씩 골라 조합 → 생성/조회/수정/삭제,
  선택한 옷들을 한 장으로 합성한 이미지도 자동 생성됨

향후 변경 이력은 `git log`로 확인한다(세션마다 이 섹션을 계속 고쳐 쓰지 않는다).

## Gemini 의존도 제거 완료 (2026-09-03)

세 AI 기능 중 배경제거/합성은 생성형 AI가 필요 없는 작업이라 벤더 의존을 없앴고, OCR도 기본은
무료 로컬 처리로 전환했다. **자체 모델을 학습시킨 게 아니라 공개된 오픈소스 사전학습 모델을 이
서버 프로세스 안에서 직접 실행**하는 방식이다.

- **배경 제거**: `providers/localImageProvider.js` — `@imgly/background-removal-node`(오픈소스
  세그멘테이션 ONNX 모델, npm 패키지 하나로 설치, 외부 API 호출 없음)로 배경을 지우고,
  `sharp`로 트리밍/리사이즈해 정중앙에 배치. **주의**: `removeBackground()`에 mime 타입 없는
  순수 Buffer를 넘기면 "Unsupported format" 에러가 난다 — 반드시 `new Blob([buffer], { type: mimeType })`로
  감싸서 전달해야 함(이미 처리됨). 한계: 사진에 옷 외에 다른 뚜렷한 물체(예: 색상 선택 동그라미
  같은 쇼핑몰 UI 요소)가 있으면 그것도 "피사체"로 같이 남는 경우가 있음 — 실제 옷을 촬영한 사진에는
  거의 해당 없음.
- **코디 합성 이미지**: `services/outfitComposer.js` — `sharp`로 옷 이미지들을 정사각형 셀에 리사이즈해
  격자로 합성, `/uploads/outfit-*.png`로 저장. outfit 레코드의 `image` 필드에 저장되고, 코디 생성/수정
  시마다 새로 만들고 이전 파일은 지운다(`routes/outfits.js`).
- **OCR**: `providers/localOcrProvider.js` — `tesseract.js`(한국어+영어)로 텍스트를 읽고 정규식으로
  가격/사이즈만 추출, 나머지 원문은 memo에 담아 사용자가 직접 확인하게 함. 순수 숫자만으로는
  사이즈를 특정하기 어려워 "사이즈"라는 라벨이 근처에 있거나 mm/호 단위가 붙은 경우만 인정하도록
  정규식을 좁혀놨다(안 그러면 상품코드/할인율 등을 사이즈로 오탐함).
  가격/사이즈를 둘 다 못 찾았을 때만 `GEMINI_API_KEY`가 있으면 Gemini로 보조 시도(하이브리드).
- `resolveProvider()` 기본값이 이제 `local`이다(`AI_IMAGE_PROVIDER`/`AI_OCR_PROVIDER` 둘 다).
  `gemini`/`noop`으로 명시적으로 되돌릴 수도 있음.
- tesseract.js가 첫 실행 시 언어 데이터(`backend/*.traineddata`)를 자동으로 내려받아 backend
  루트에 캐시한다 — git에는 안 올라감(.gitignore 처리).

## PC 상태와 무관한 24/7 배포 완료 (2026-09-03~2026-09-05)

목표(달성함): 로그인 없이(멀티유저/인증은 더 나중), 지금 있는 기능 그대로를 사용자의 PC가 꺼져 있어도
항상 접속 가능한 실제 호스팅에 올리는 것.

**배포 주소: https://whats-in-my-closet-1.onrender.com** (Render, Oregon 리전, 무료 티어).
배포 후 실제 공개 URL에서 카테고리/등록된 옷/코디 페이지를 데스크톱·모바일 뷰포트 모두 확인 완료.
무료 티어라 15분 이상 미접속 시 슬립되고, 첫 요청은 최대 50초 정도 걸릴 수 있음(Render 안내 문구).

**완료(2026-09-05)**:
- GitHub 저장소 연결: https://github.com/kowj4004/whats-in-my-closet (origin, push는 명시적 요청 시에만)
- Supabase 프로젝트 생성 + Postgres 연동 완료. **주의**: Supabase의 직접 연결 호스트(`db.<ref>.supabase.co`)는
  IPv6 전용이라 이 개발 환경(및 Render 등 IPv4 환경)에서 DNS는 되지만 연결이 안 될 수 있다 —
  반드시 **Session/Transaction Pooler** 연결 문자열(`aws-0-<region>.pooler.supabase.com`, 사용자명이
  `postgres.<project-ref>` 형태)을 써야 한다. `.env`의 `DATABASE_URL`이 이미 pooler 방식으로 설정됨.
- DB 어댑터화 완료: `clothesStore.js`/`outfitsStore.js`가 `DATABASE_URL` 유무로 json/pg 구현을 스위칭.
  기존 JSON 데이터(옷 3개, 코디 1개)는 `npm run migrate:data --prefix backend`로 id 보존한 채 이전 완료,
  실제 API(create/update/delete)로 재검증함.
- `server.js`에 `frontend/dist` 정적 서빙 + SPA 폴백 추가(배포 시 프론트/백엔드를 한 Render Web Service로
  합쳐서 서빙하기 위함). 로컬 개발에는 영향 없음(dist가 없으면 그냥 건너뜀).

- **이미지 저장소도 Supabase Storage로 이전 완료.** `backend/src/services/storage/`가 스위처
  (`index.js`) + `localStorage.js`(개발 기본값) + `supabaseStorage.js`(SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY
  있을 때) 구조. `imageFile.js`(옷 사진)와 `outfitComposer.js`(코디 합성)가 전부 이 계층을 통해서만
  파일을 읽고/쓰고/지운다 — 둘 다 더 이상 `fs`/`UPLOAD_DIR`을 직접 건드리지 않는다.
  버킷은 `closet-images`(public)로 만들어뒀다. 기존 로컬 이미지 4개(옷 3개 + 코디 합성 1개)는
  `npm run migrate:uploads --prefix backend`로 옮기고 DB의 image URL도 갱신함, 로컬 원본은 삭제.
  create/delete를 실제 API로 재검증(업로드→공개 URL 200 확인→삭제→404 확인)함.

**남은 작업**: 없음(이번 라운드 기준). 앞으로 기능을 추가하면 git push 후 Render가 자동으로
재배포한다(Render는 GitHub 저장소를 연결해뒀으므로 push = 배포 트리거). 로그인/멀티유저는
사용자가 나중에 요청하면 아래 장기 로드맵 A/B/C안 중 하나로 진행.

**Render 설정 참고값** (Root Directory는 리포 루트로 비워둠):
- Build Command: `npm install --prefix backend && npm install --prefix frontend && npm run build --prefix frontend`
- Start Command: `npm start --prefix backend`
- 참고: 루트 `package.json`의 `install:all`/`dev`는 로컬 동시 실행용(concurrently)이라 배포에는 안 씀 —
  배포는 프론트를 빌드해서 백엔드가 정적으로 서빙하는 단일 서비스 구조.

장기적으로는(사용자가 나중에 요청하면) 로그인/멀티유저까지 확장 — 그때 후보 A/B/C안:
  - **A안(Supabase/Firebase 등 BaaS)**: 인증+DB+스토리지 통합, 가장 빠르지만 백엔드 절반 리라이트.
  - **B안(지금 구조 유지, 현재 진행 중인 방향과 가장 가까움)**: Express·store 패턴 유지, DB만 Postgres로
    교체 + 인증만 나중에 별도 추가(Clerk 등).
  - **C안(Cloudflare 풀스택)**: Pages+Workers+D1+R2. 무료 티어 가장 넉넉하지만 Express를 못 그대로
    올려서(Workers는 Node 런타임 아님) 라우팅 레이어 재작성 필요.
  - 멀티유저가 되는 순간 Gemini API 키 공유 문제가 생기므로, 그 시점엔 "사용자별 키 입력" 또는
    "운영자가 비용 부담"을 결정해야 함(배경제거/합성은 이미 로컬 모델로 전환해서 이 시점에 남는
    비용 이슈는 OCR 보조 폴백 정도로 최소화됨).

## 참고: 임시 데모용 Cloudflare Tunnel (지금은 안 씀)

어제 Cloudflare Quick Tunnel(무계정, 무료)로 임시 공개 URL을 띄운 적 있다(`frontend/vite.config.js`의
`server.allowedHosts: [".trycloudflare.com"]`가 그 흔적, `cloudflared`는 winget으로 설치돼 있음).
세션이 끝나거나 PC가 유휴 상태가 되면 같이 죽고, 다시 켜면 주소도 매번 바뀐다 — 이번에 진행하는
Render 배포가 끝나면 이 방식은 쓸 일이 없어진다.
