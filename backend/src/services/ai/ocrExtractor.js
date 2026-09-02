// OCR/정보 추출 기능의 진입점(퍼블릭 인터페이스).
// routes/ai.js는 이 모듈만 호출하며, 실제 OCR/AI 서비스가 무엇인지 알 필요가 없다.

import { geminiExtractInfo } from "./providers/geminiProvider.js";
import { noopExtractInfo } from "./providers/noopProvider.js";

function resolveProvider() {
  const configured = (process.env.AI_OCR_PROVIDER || "").toLowerCase();
  if (configured === "gemini") return "gemini";
  if (configured === "noop") return "noop";
  return process.env.GEMINI_API_KEY ? "gemini" : "noop";
}

/**
 * 이미지에서 구매처/사이즈/가격 등의 정보를 추출한다.
 * 실패 시에도 예외를 던지지 않고 빈 값 + 안내 메시지를 반환해
 * 사용자가 직접 입력 화면에서 채워 넣을 수 있도록 한다.
 * @param {Buffer} buffer
 * @param {string} mimeType
 * @returns {Promise<{ fields: object, available: boolean, message: string }>}
 */
export async function extractClothInfo(buffer, mimeType) {
  const provider = resolveProvider();

  if (provider === "noop") {
    const fields = await noopExtractInfo();
    return {
      fields,
      available: false,
      message: "AI/OCR 기능이 설정되어 있지 않습니다. 직접 정보를 입력해주세요.",
    };
  }

  try {
    const fields = await geminiExtractInfo(buffer, mimeType);
    return { fields, available: true, message: "이미지에서 정보를 추출했습니다. 확인 후 저장해주세요." };
  } catch (err) {
    console.error("[ocrExtractor] Gemini 정보 추출 실패:", err.message);
    const fields = await noopExtractInfo();
    return {
      fields,
      available: false,
      message: `AI 정보 추출에 실패했습니다. 직접 입력해주세요. (${err.message})`,
    };
  }
}
