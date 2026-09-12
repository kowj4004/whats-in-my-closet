// 1회성 스크립트: 카테고리가 전역 categories.json 하나였던 시절의 옷 데이터(category 문자열:
// top/bottom/accessory/shoes)를, 사용자별 categories 테이블 행으로 옮기고 clothes.category_id를
// 채운다. 실행: node scripts/migrate-categories-to-db.js

import "dotenv/config";
import { getPool, isPostgresEnabled } from "../src/db/postgresPool.js";
import { ensureDefaultCategories, listCategories } from "../src/db/pgCategoriesStore.js";

const OLD_TO_NAME = { top: "상의", bottom: "하의", accessory: "악세사리", shoes: "신발" };

async function main() {
  if (!isPostgresEnabled()) {
    console.log("DATABASE_URL이 없습니다.");
    return;
  }
  const pool = getPool();

  const { rows: clothes } = await pool.query(
    "SELECT id, user_id, category FROM clothes WHERE category_id IS NULL AND category IS NOT NULL"
  );
  if (clothes.length === 0) {
    console.log("옮길 데이터가 없습니다(이미 완료됐거나 category 컬럼이 없음).");
    return;
  }

  const userIds = [...new Set(clothes.map((c) => c.user_id))];
  for (const userId of userIds) {
    await ensureDefaultCategories(userId);
  }

  for (const cloth of clothes) {
    const targetName = OLD_TO_NAME[cloth.category] || cloth.category;
    const categories = await listCategories(cloth.user_id);
    const match = categories.find((c) => c.name === targetName && !c.parentId);
    if (!match) {
      console.log(`건너뜀(카테고리 못 찾음): cloth ${cloth.id}, category=${cloth.category}`);
      continue;
    }
    await pool.query("UPDATE clothes SET category_id = $1 WHERE id = $2", [match.id, cloth.id]);
    console.log(`cloth ${cloth.id}: ${cloth.category} -> ${match.name}(${match.id})`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
