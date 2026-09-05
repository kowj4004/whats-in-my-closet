// 로컬 디스크(backend/uploads) 기반 저장소. 개발 환경 기본값이자,
// SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY가 없을 때의 폴백이다.

import fs from "fs/promises";
import path from "path";
import { UPLOAD_DIR } from "../../middleware/upload.js";

export async function uploadFile(buffer, filename) {
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

export async function deleteFile(url) {
  if (!url || !url.startsWith("/uploads/")) return;
  const filePath = path.join(UPLOAD_DIR, url.replace("/uploads/", ""));
  await fs.unlink(filePath).catch(() => {});
}

export async function readFile(url) {
  return fs.readFile(path.join(UPLOAD_DIR, url.replace("/uploads/", "")));
}
