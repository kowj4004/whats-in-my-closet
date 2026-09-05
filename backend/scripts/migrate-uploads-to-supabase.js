// 1회성 스크립트: backend/uploads/에 남아있는 기존 이미지들(옷 사진, 코디 합성 이미지)을
// Supabase Storage로 올리고, DB(clothes/outfits)의 image URL을 새 주소로 갱신한다.
// 실행: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY와 DATABASE_URL이 .env에 설정된 상태에서
//       `npm run migrate:uploads --prefix backend`

import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { isRemoteStorageEnabled, uploadFile } from "../src/services/storage/index.js";
import { getPool, isPostgresEnabled } from "../src/db/postgresPool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

const MIME_BY_EXT = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

async function migrateLocalUrl(localUrl) {
  const filename = localUrl.replace("/uploads/", "");
  const buffer = await fs.readFile(path.join(UPLOAD_DIR, filename));
  const ext = path.extname(filename).toLowerCase();
  return uploadFile(buffer, filename, MIME_BY_EXT[ext] || "application/octet-stream");
}

async function main() {
  if (!isRemoteStorageEnabled()) {
    console.log("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY가 없어 마이그레이션을 건너뜁니다.");
    return;
  }
  if (!isPostgresEnabled()) {
    console.log("DATABASE_URL이 없어 마이그레이션을 건너뜁니다(현재는 Postgres 사용 중일 때만 지원).");
    return;
  }

  const pool = getPool();

  const { rows: clothes } = await pool.query("SELECT id, image FROM clothes WHERE image LIKE '/uploads/%'");
  for (const c of clothes) {
    const newUrl = await migrateLocalUrl(c.image);
    await pool.query("UPDATE clothes SET image = $1 WHERE id = $2", [newUrl, c.id]);
    console.log(`clothes ${c.id}: ${c.image} -> ${newUrl}`);
  }

  const { rows: outfits } = await pool.query("SELECT id, image FROM outfits WHERE image LIKE '/uploads/%'");
  for (const o of outfits) {
    const newUrl = await migrateLocalUrl(o.image);
    await pool.query("UPDATE outfits SET image = $1 WHERE id = $2", [newUrl, o.id]);
    console.log(`outfits ${o.id}: ${o.image} -> ${newUrl}`);
  }

  console.log(`완료: clothes ${clothes.length}개, outfits ${outfits.length}개`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
