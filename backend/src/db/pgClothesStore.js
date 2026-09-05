// jsonClothesStore.js와 동일한 인터페이스를 Postgres(Supabase)로 구현한 버전.
// "코어" 필드(category/image/store/size/price/memo) 외에 들어오는 값은
// extra(JSONB)에 저장했다가 조회 시 다시 펼쳐서 돌려준다(JSON 파일 버전의 자유 필드 허용과 동일하게).

import { getPool } from "./postgresPool.js";

const CORE_FIELDS = ["category", "image", "store", "size", "price", "memo"];

function splitFields(data) {
  const core = {};
  const extra = {};
  for (const [key, value] of Object.entries(data)) {
    if (CORE_FIELDS.includes(key)) core[key] = value;
    else if (key !== "id" && key !== "createdAt" && key !== "updatedAt") extra[key] = value;
  }
  return { core, extra };
}

function rowToItem(row) {
  return {
    id: row.id,
    category: row.category,
    image: row.image,
    store: row.store,
    size: row.size,
    price: row.price === null ? null : Number(row.price),
    memo: row.memo,
    ...row.extra,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listClothes({ category } = {}) {
  const pool = getPool();
  const { rows } = category
    ? await pool.query("SELECT * FROM clothes WHERE category = $1 ORDER BY created_at DESC", [category])
    : await pool.query("SELECT * FROM clothes ORDER BY created_at DESC");
  return rows.map(rowToItem);
}

export async function getCloth(id) {
  const pool = getPool();
  const { rows } = await pool.query("SELECT * FROM clothes WHERE id = $1", [id]);
  return rows[0] ? rowToItem(rows[0]) : null;
}

export async function createCloth(data) {
  const pool = getPool();
  const { core, extra } = splitFields(data);
  const { rows } = await pool.query(
    `INSERT INTO clothes (id, category, image, store, size, price, memo, extra, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, now(), now())
     RETURNING *`,
    [core.category, core.image || "", core.store || "", core.size || "", core.price ?? null, core.memo || "", extra]
  );
  return rowToItem(rows[0]);
}

export async function updateCloth(id, patch) {
  const pool = getPool();
  const existing = await getCloth(id);
  if (!existing) return null;

  const merged = { ...existing, ...patch };
  const { core, extra } = splitFields(merged);
  const { rows } = await pool.query(
    `UPDATE clothes SET category = $2, image = $3, store = $4, size = $5, price = $6, memo = $7, extra = $8, updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, core.category, core.image || "", core.store || "", core.size || "", core.price ?? null, core.memo || "", extra]
  );
  return rows[0] ? rowToItem(rows[0]) : null;
}

export async function deleteCloth(id) {
  const pool = getPool();
  const existing = await getCloth(id);
  if (!existing) return false;
  await pool.query("DELETE FROM clothes WHERE id = $1", [id]);
  return existing;
}
