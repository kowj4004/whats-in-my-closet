// Gemini API를 사용하는 실제 구현체.
// - 이미지 배경 제거/정리: Gemini의 이미지 생성 모델(예: gemini-2.5-flash-image)을 사용해
//   옷을 중심으로 배경을 정리한 이미지를 생성한다.
// - 정보 추출(OCR): Gemini의 멀티모달 텍스트 모델을 사용해 이미지 속 텍스트에서
//   구매처/사이즈/가격 등을 JSON으로 추출한다.
//
// 이 파일은 "Gemini"라는 특정 서비스에 대한 세부 구현만 담당하고,
// 상위 모듈(imageProcessor.js, ocrExtractor.js)은 이 구현을 몰라도 되도록 분리되어 있다.
// 다른 AI 서비스로 교체하려면 이 파일과 동일한 함수 시그니처를 가진 provider 파일을
// providers/ 아래에 추가하고 index.js에서 선택하도록 하면 된다.

import { GoogleGenerativeAI } from "@google/generative-ai";

const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3.6-flash";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되어 있지 않습니다.");
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * 옷 사진에서 배경을 제거/정리한 이미지를 생성한다.
 * @param {Buffer} buffer 원본 이미지
 * @param {string} mimeType 원본 이미지 MIME 타입
 * @returns {Promise<{ buffer: Buffer, mimeType: string }>}
 */
export async function geminiRemoveBackground(buffer, mimeType) {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: IMAGE_MODEL });

  const prompt =
    "이 이미지 속 옷을 중심으로 사진을 정리해줘. 옷만 남기고 배경은 깔끔한 흰색 또는 " +
    "투명에 가까운 단색 배경으로 바꿔줘. 옷의 형태, 색상, 디테일은 최대한 원본 그대로 유지하고, " +
    "옷장 그리드에서 보기 좋도록 정중앙에 배치하고 여백을 균등하게 잘라줘.";

  const result = await model.generateContent([
    { text: prompt },
    { inlineData: { data: buffer.toString("base64"), mimeType } },
  ]);

  const parts = result.response?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData);
  if (!imagePart) {
    throw new Error("Gemini 응답에서 이미지를 찾을 수 없습니다.");
  }

  return {
    buffer: Buffer.from(imagePart.inlineData.data, "base64"),
    mimeType: imagePart.inlineData.mimeType || "image/png",
  };
}

/**
 * 옷/영수증/구매 화면 이미지에서 구매처, 사이즈, 가격 등의 정보를 추출한다.
 * @param {Buffer} buffer
 * @param {string} mimeType
 * @returns {Promise<{ store?: string, size?: string, price?: number, memo?: string }>}
 */
export async function geminiExtractInfo(buffer, mimeType) {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: TEXT_MODEL,
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt =
    "다음 이미지는 옷 사진이거나, 옷 구매 내역/쇼핑몰 화면 캡처입니다. " +
    "이미지에서 아래 정보를 최대한 정확히 추출해서 JSON으로만 응답하세요. " +
    "알 수 없는 값은 빈 문자열(가격은 null)로 두세요.\n" +
    '형식: {"store": "구매처(브랜드/쇼핑몰명)", "size": "사이즈", "price": 숫자(원 단위, 없으면 null), "memo": "기타 특이사항이나 상품명 등 참고할 만한 정보"}';

  const result = await model.generateContent([
    { text: prompt },
    { inlineData: { data: buffer.toString("base64"), mimeType } },
  ]);

  const text = result.response?.text?.() ?? "";
  const cleaned = text.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      store: parsed.store ?? "",
      size: parsed.size ?? "",
      price: typeof parsed.price === "number" ? parsed.price : null,
      memo: parsed.memo ?? "",
    };
  } catch {
    throw new Error("Gemini 응답을 JSON으로 해석하지 못했습니다: " + text);
  }
}
