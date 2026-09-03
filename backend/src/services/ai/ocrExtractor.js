// OCR/정보 추출 기능의 진입점(퍼블릭 인터페이스).
// routes/ai.js는 이 모듈만 호출하며, 실제 OCR/AI 서비스가 무엇인지 알 필요가 없다.

import { geminiExtractInfo } from "./providers/geminiProvider.js";
import { localExtractInfo } from "./providers/localOcrProvider.js";
import { noopExtractInfo } from "./providers/noopProvider.js";

function resolveProvider() {
  const configured = (process.env.AI_OCR_PROVIDER || "").toLowerCase();
  if (configured === "gemini") return "gemini";
  if (configured === "local") return "local";
  if (configured === "noop") return "noop";
  // 명시적 설정이 없으면 무료 로컬 OCR을 기본으로 사용
  return "local";
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

  if (provider === "local") {
    try {
      const fields = await localExtractInfo(buffer);
      const weak = !fields.price && !fields.size; // 로컬 OCR이 핵심 정보를 못 찾은 경우
      if (weak && process.env.GEMINI_API_KEY) {
        try {
          const geminiFields = await geminiExtractInfo(buffer, mimeType);
          return {
            fields: geminiFields,
            available: true,
            message: "로컬 OCR로 정보를 찾지 못해 AI로 보완했습니다. 확인 후 저장해주세요.",
          };
        } catch (err) {
          console.error("[ocrExtractor] Gemini 보조 추출 실패:", err.message);
          // 보조 시도가 실패해도 로컬 OCR 결과(원문 메모 등)는 그대로 살려서 반환한다.
        }
      }
      return {
        fields,
        available: true,
        message: "로컬 OCR로 정보를 추출했습니다. 확인 후 저장해주세요.",
      };
    } catch (err) {
      console.error("[ocrExtractor] 로컬 OCR 실패:", err.message);
      const fields = await noopExtractInfo();
      return {
        fields,
        available: false,
        message: `정보 추출에 실패했습니다. 직접 입력해주세요. (${err.message})`,
      };
    }
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
