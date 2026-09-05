// 1회성 스크립트: backend/data/*.json에 있던 기존 데이터를 Postgres(Supabase)로 옮긴다.
// id/생성일시를 그대로 보존해서 코디(outfit)가 참조하는 itemIds가 깨지지 않게 한다.
// 실행: DATABASE_URL이 .env에 설정된 상태에서 `npm run migrate:data --prefix backend`

import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getPool, isPostgresEnabled } from "../src/db/postgresPool.js";
import { runMigrations } from "../src/db/migrate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf-8"));
  } catch {
    return [];
  }
}

async function main() {
  if (!isPostgresEnabled()) {
    console.log("DATABASE_URL이 설정되어 있지 않아 마이그레이션을 건너뜁니다.");
    return;
  }

  await runMigrations();
  const pool = getPool();

  const clothes = await readJson(path.join(__dirname, "..", "data", "clothes.json"));
  const outfits = await readJson(path.join(__dirname, "..", "data", "outfits.json"));

  for (const c of clothes) {
    const { id, category, image, store, size, price, memo, createdAt, updatedAt, ...extra } = c;
    await pool.query(
      `INSERT INTO clothes (id, category, image, store, size, price, memo, extra, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO NOTHING`,
      [id, category, image || "", store || "", size || "", price ?? null, memo || "", extra, createdAt, updatedAt]
    );
  }
  console.log(`clothes: ${clothes.length}개 이전 완료`);

  for (const o of outfits) {
    await pool.query(
      `INSERT INTO outfits (id, name, item_ids, image, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO NOTHING`,
      [o.id, o.name || "", JSON.stringify(o.itemIds), o.image || "", o.createdAt, o.updatedAt]
    );
  }
  console.log(`outfits: ${outfits.length}개 이전 완료`);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
