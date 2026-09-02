// 업로드된 원본 이미지 파일을 AI 이미지 정리 모듈에 통과시키고,
// 그 결과를 디스크에 최종 파일로 저장하는 유틸리티.
// routes/clothes.js에서 "새 이미지가 업로드될 때"마다 공통으로 사용한다.

import fs from "fs/promises";
import path from "path";
import { UPLOAD_DIR } from "../middleware/upload.js";
import { processClothingImage } from "./ai/imageProcessor.js";

const MIME_TO_EXT = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
};

function extFor(mimeType) {
  return MIME_TO_EXT[mimeType] || ".jpg";
}

/**
 * multer가 저장한 원본 업로드 파일을 읽어 AI 배경 정리를 적용하고,
 * 최종 파일을 uploads 디렉터리에 저장한다.
 * @param {Express.Multer.File} file multer가 채워준 req.file
 * @returns {Promise<{ imageUrl: string, processed: boolean, message: string }>}
 */
export async function finalizeUploadedImage(file) {
  const originalBuffer = await fs.readFile(file.path);
  const result = await processClothingImage(originalBuffer, file.mimetype);

  const ext = extFor(result.mimeType);
  const base = path.basename(file.filename, path.extname(file.filename));
  const finalFilename = `${base}${ext}`;
  const finalPath = path.join(UPLOAD_DIR, finalFilename);

  await fs.writeFile(finalPath, result.buffer);
  if (finalPath !== file.path) {
    await fs.unlink(file.path).catch(() => {});
  }

  return {
    imageUrl: `/uploads/${finalFilename}`,
    processed: result.processed,
    message: result.message,
  };
}

/** image URL(/uploads/xxx)로부터 실제 파일을 삭제한다. 존재하지 않아도 에러를 던지지 않는다. */
export async function removeImageByUrl(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) return;
  const filename = imageUrl.replace("/uploads/", "");
  const filePath = path.join(UPLOAD_DIR, filename);
  await fs.unlink(filePath).catch(() => {});
}
