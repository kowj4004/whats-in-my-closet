// 외부 AI 벤더(과금/할당량) 없이, 로컬에 내려받은 오픈소스 세그멘테이션 모델(ONNX)로
// 배경을 제거한다. @imgly/background-removal-node가 모델 실행을, sharp가 트리밍/리사이즈/
// 캔버스 합성을 담당한다. 완전히 이 서버 프로세스 안에서 끝나며 외부 API 호출이 없다.

import { removeBackground } from "@imgly/background-removal-node";
import sharp from "sharp";

// 옷장 그리드 카드 비율(3:4)에 맞춘 출력 크기.
const OUTPUT_WIDTH = 900;
const OUTPUT_HEIGHT = 1200;
const PADDING_RATIO = 0.08; // 옷 주위 여백 비율

export async function localRemoveBackground(buffer, mimeType = "image/jpeg") {
  // removeBackground는 내부적으로 Blob.type으로 포맷을 판별하므로, mime 타입 없는
  // 순수 Buffer를 넘기면 "Unsupported format"으로 실패한다. 명시적으로 Blob에 담아 전달.
  const input = new Blob([buffer], { type: mimeType });
  const blob = await removeBackground(input, {
    model: "small", // 속도 우선(~40MB). 품질을 높이려면 "medium"으로 변경.
    output: { format: "image/png", type: "foreground" },
  });
  const cutout = Buffer.from(await blob.arrayBuffer());

  // 투명 배경 기준으로 옷 실루엣만 타이트하게 크롭.
  const trimmed = await sharp(cutout).trim({ threshold: 10 }).toBuffer();

  const maxWidth = Math.round(OUTPUT_WIDTH * (1 - PADDING_RATIO * 2));
  const maxHeight = Math.round(OUTPUT_HEIGHT * (1 - PADDING_RATIO * 2));

  const resized = await sharp(trimmed)
    .resize({ width: maxWidth, height: maxHeight, fit: "inside" })
    .toBuffer();
  const { width: rw, height: rh } = await sharp(resized).metadata();

  const finalBuffer = await sharp({
    create: {
      width: OUTPUT_WIDTH,
      height: OUTPUT_HEIGHT,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: resized,
        left: Math.round((OUTPUT_WIDTH - rw) / 2),
        top: Math.round((OUTPUT_HEIGHT - rh) / 2),
      },
    ])
    .png()
    .toBuffer();

  return { buffer: finalBuffer, mimeType: "image/png" };
}
