# What's in My Closet (1차 MVP)

개인 옷장을 카테고리별로 등록/관리하는 웹서비스입니다.

## 기술 스택

- 프론트엔드: React 18 + Vite, React Router
- 백엔드: Node.js + Express
- 데이터 저장: JSON 파일 기반 저장소 (`backend/data/clothes.json`), 이미지 파일은 `backend/uploads/`
- AI/OCR: Google Gemini API를 어댑터로 연동 (`backend/src/services/ai/`), API 키 미설정 시 자동으로 비활성화되고 수동 입력으로 폴백

## 폴더 구조

```
whats-in-my-closet/
  backend/
    src/
      server.js              # Express 앱 진입점
      config/categories.json # 카테고리 정의 (여기에 항목만 추가하면 카테고리 확장 가능)
      db/                     # 데이터 저장소 (clothesStore, categoriesStore)
      routes/                 # /api/categories, /api/clothes, /api/ai
      middleware/upload.js    # multer 업로드 설정
      services/
        imageFile.js          # 업로드 파일 저장 + AI 이미지 정리 연결
        ai/
          imageProcessor.js   # 배경 제거 기능의 공개 인터페이스
          ocrExtractor.js     # 정보 추출 기능의 공개 인터페이스
          providers/
            geminiProvider.js # Gemini 실제 구현
            noopProvider.js   # AI 미사용 시 폴백 구현
    data/clothes.json         # 옷 데이터 (최초 실행 시 빈 배열)
    uploads/                  # 업로드된 옷 이미지 저장 위치
  frontend/
    src/
      pages/                  # Home, CategoryView, ClothDetail
      components/             # ClothGrid, ClothCard, AddClothModal, ManualEntryForm, CaptureOcrEntry
      api/client.js           # 백엔드 API 호출 함수 모음
      styles/global.css
```

## 실행 방법

Node.js 18 이상이 설치되어 있어야 합니다.

```bash
# 1) 의존성 설치 (루트에서 한 번에)
npm run install:all

# 2) 백엔드 환경변수 설정 (선택 사항 - AI 기능을 쓰려면 필요)
cp backend/.env.example backend/.env
# backend/.env 파일을 열어 GEMINI_API_KEY 값을 채워주세요.
# 비워두면 AI 기능 없이 수동 입력만으로 정상 동작합니다.

# 3) 개발 서버 동시 실행 (백엔드: 4000, 프론트엔드: 5173)
npm run dev
```

브라우저에서 http://localhost:5173 접속하면 됩니다. (프론트엔드가 `/api`, `/uploads` 요청을 자동으로 백엔드로 프록시합니다.)

각각 따로 실행하고 싶다면:

```bash
npm run dev:backend   # http://localhost:4000
npm run dev:frontend  # http://localhost:5173
```

## API 개요

| Method | Endpoint             | 설명                                   |
| ------ | --------------------- | -------------------------------------- |
| GET    | /api/categories        | 카테고리 목록 조회                      |
| GET    | /api/clothes?category= | 카테고리별(또는 전체) 옷 목록 조회       |
| GET    | /api/clothes/:id        | 옷 상세 조회                            |
| POST   | /api/clothes            | 옷 등록 (multipart/form-data, image 필수) |
| PUT    | /api/clothes/:id        | 옷 수정 (image는 선택)                  |
| DELETE | /api/clothes/:id        | 옷 삭제 (이미지 파일도 함께 삭제)         |
| POST   | /api/ai/extract         | 이미지에서 정보 추출 (저장하지 않음)      |

## 데이터 구조

```json
{
  "id": "uuid",
  "category": "top",
  "image": "/uploads/xxxx.png",
  "store": "무신사",
  "size": "M",
  "price": 59000,
  "memo": "가을에 입기 좋음",
  "createdAt": "2026-09-02T12:00:00.000Z",
  "updatedAt": "2026-09-02T12:00:00.000Z"
}
```

`store/size/price/memo` 외의 필드를 요청에 추가로 보내면 그대로 저장됩니다(향후 필드 확장 대비).

## 카테고리 추가하는 방법

`backend/src/config/categories.json`에 항목을 추가하면 됩니다. 코드 수정이나 재배포 없이 즉시 반영됩니다.

```json
{ "id": "outer", "name": "아우터", "order": 4 }
```

## AI 기능 (배경 정리 / OCR 정보 추출)

- 옷 사진을 업로드/등록할 때마다 `services/ai/imageProcessor.js`가 배경 정리를 시도합니다.
- "이미지로 자동 입력" 탭에서는 `services/ai/ocrExtractor.js`가 이미지 속 텍스트에서 구매처/사이즈/가격/메모를 추출해 입력 폼에 미리 채워주며, 사용자가 확인/수정한 뒤에만 저장됩니다.
- 두 기능 모두 Gemini를 기본 provider로 사용하고, `GEMINI_API_KEY`가 없거나 호출이 실패하면 예외를 던지지 않고 안전하게 폴백합니다(배경 정리는 원본 이미지 유지, 정보 추출은 빈 값 반환).
- 다른 AI 서비스로 교체하려면 `services/ai/providers/`에 동일한 함수 시그니처의 provider 파일을 추가하고, `imageProcessor.js` / `ocrExtractor.js`의 `resolveProvider()`에서 분기만 추가하면 됩니다. API 키는 항상 백엔드 `.env`에서만 읽고 프론트엔드 코드에는 절대 포함되지 않습니다.

## 참고 (개발 환경 관련)

이 코드는 네트워크가 제한된 샌드박스 환경에서 작성되어 `npm install` 및 실제 서버 기동 테스트를 이 환경에서는 실행하지 못했습니다. 코드 전체는 문법 검증(`node --check`)과 수동 리뷰를 거쳤지만, 로컬 환경에서 `npm run install:all` 및 `npm run dev` 실행 후 정상 동작 여부를 한 번 확인해주세요. 실행 중 에러가 발생하면 알려주시면 바로 수정하겠습니다.
