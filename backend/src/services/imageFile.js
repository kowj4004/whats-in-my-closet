// 업로드된 원본 이미지 파일을 AI 이미지 정리 모듈에 통과시키고,
// 그 결과를 저장소(storage/index.js — 로컬 디스크 또는 Supabase Storage)에 저장하는 유틸리티.
// routes/clothes.js에서 "새 이미지가 업로드될 때"마다 공통으로 사용한다.

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { processClothingImage } from "./ai/imageProcessor.js";
import { uploadFile, deleteFile } from "./storage/index.js";

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
 * multer가 저장한 원본 업로드 파일을 읽어 AI 배경 정리를 적용하고, 최종 파일을 저장소에 올린다.
 * @param {Express.Multer.File} file multer가 채워준 req.file
 * @returns {Promise<{ imageUrl: string, processed: boolean, message: string }>}
 */
export async function finalizeUploadedImage(file) {
  const originalBuffer = await fs.readFile(file.path);
  const result = await processClothingImage(originalBuffer, file.mimetype);

  const ext = extFor(result.mimeType);
  const base = path.basename(file.filename, path.extname(file.filename));
  const finalFilename = `${base}${ext}`;

  const imageUrl = await uploadFile(result.buffer, finalFilename, result.mimeType);
  await fs.unlink(file.path).catch(() => {}); // multer가 만든 원본 임시 파일 정리

  return { imageUrl, processed: result.processed, message: result.message };
}

/** image URL로부터 실제 파일을 삭제한다(로컬/Supabase 모두 지원). 존재하지 않아도 에러를 던지지 않는다. */
export async function removeImageByUrl(imageUrl) {
  await deleteFile(imageUrl);
}

/**
 * 카테고리 썸네일 이미지를 저장한다. 옷 사진과 달리 AI 배경 정리는 적용하지 않고
 * (카테고리 아이콘은 옷 자체가 아닐 수도 있어서) 정사각형으로 리사이즈만 해서 저장소에 올린다.
 */
export async function finalizeCategoryImage(file) {
  const buffer = await sharp(file.path).resize(400, 400, { fit: "cover" }).png().toBuffer();
  const filename = `category-${randomUUID()}.png`;
  const imageUrl = await uploadFile(buffer, filename, "image/png");
  await fs.unlink(file.path).catch(() => {});
  return imageUrl;
}
