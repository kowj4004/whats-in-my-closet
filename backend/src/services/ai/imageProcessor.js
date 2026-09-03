// 옷 사진 배경 제거/정리 기능의 진입점(퍼블릭 인터페이스).
// 라우트(routes/clothes.js)는 이 모듈만 알면 되고, 실제로 어떤 AI 서비스를 쓰는지는
// 신경 쓰지 않는다. provider를 교체하고 싶다면 providers/ 아래에 파일을 추가하고
// resolveProvider()에서 분기만 추가하면 된다.

import { geminiRemoveBackground } from "./providers/geminiProvider.js";
import { localRemoveBackground } from "./providers/localImageProvider.js";
import { noopRemoveBackground } from "./providers/noopProvider.js";

function resolveProvider() {
  const configured = (process.env.AI_IMAGE_PROVIDER || "").toLowerCase();
  if (configured === "gemini") return "gemini";
  if (configured === "local") return "local";
  if (configured === "noop") return "noop";
  // 명시적 설정이 없으면 과금/할당량 걱정 없는 로컬 오픈소스 모델을 기본으로 사용
  return "local";
}

/**
 * 옷 이미지를 정리한다. 실패하더라도 예외를 던지지 않고
 * 원본 이미지를 그대로 사용하도록 폴백한다(업로드 자체가 실패하면 안 되므로).
 * @param {Buffer} buffer
 * @param {string} mimeType
 * @returns {Promise<{ buffer: Buffer, mimeType: string, processed: boolean, message: string }>}
 */
export async function processClothingImage(buffer, mimeType) {
  const provider = resolveProvider();

  if (provider === "noop") {
    const result = await noopRemoveBackground(buffer, mimeType);
    return {
      ...result,
      processed: false,
      message: "AI 이미지 정리가 설정되어 있지 않아 원본 이미지를 그대로 사용합니다.",
    };
  }

  if (provider === "local") {
    try {
      const result = await localRemoveBackground(buffer, mimeType);
      return { ...result, processed: true, message: "로컬 AI 모델이 배경을 정리했습니다." };
    } catch (err) {
      console.error("[imageProcessor] 로컬 배경 제거 실패, 원본 이미지로 폴백:", err.message);
      const fallback = await noopRemoveBackground(buffer, mimeType);
      return {
        ...fallback,
        processed: false,
        message: `배경 정리에 실패하여 원본 이미지를 사용합니다. (${err.message})`,
      };
    }
  }

  try {
    const result = await geminiRemoveBackground(buffer, mimeType);
    return { ...result, processed: true, message: "AI가 배경을 정리했습니다." };
  } catch (err) {
    console.error("[imageProcessor] Gemini 배경 제거 실패, 원본 이미지로 폴백:", err.message);
    const fallback = await noopRemoveBackground(buffer, mimeType);
    return {
      ...fallback,
      processed: false,
      message: `AI 이미지 정리에 실패하여 원본 이미지를 사용합니다. (${err.message})`,
    };
  }
}
