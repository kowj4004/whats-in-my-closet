// jsonClothesStore.js와 동일한 인터페이스를 Postgres(Supabase)로 구현한 버전.
// "코어" 필드(category/image/store/size/price/memo) 외에 들어오는 값은
// extra(JSONB)에 저장했다가 조회 시 다시 펼쳐서 돌려준다(JSON 파일 버전의 자유 필드 허용과 동일하게).
//
// 모든 조회/수정/삭제는 user_id로 스코프된다 — 로그인한 사용자는 자기 옷만 보고 건드릴 수 있다.
// (is_public 컬럼은 나중에 만들 공개 피드용 사전 준비이며, 지금 라우트에서는 쓰지 않는다.)

import { getPool } from "./postgresPool.js";

const CORE_FIELDS = ["category", "image", "store", "size", "price", "memo"];

function splitFields(data) {
  const core = {};
  const extra = {};
  for (const [key, value] of Object.entries(data)) {
    if (CORE_FIELDS.includes(key)) core[key] = value;
    else if (!["id", "userId", "isPublic", "createdAt", "updatedAt"].includes(key)) extra[key] = value;
  }
  return { core, extra };
}

function rowToItem(row) {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    image: row.image,
    store: row.store,
    size: row.size,
    price: row.price === null ? null : Number(row.price),
    memo: row.memo,
    isPublic: row.is_public,
    ...row.extra,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listClothes({ category, userId } = {}) {
  const pool = getPool();
  const { rows } = category
    ? await pool.query(
        "SELECT * FROM clothes WHERE user_id = $1 AND category = $2 ORDER BY created_at DESC",
        [userId, category]
      )
    : await pool.query("SELECT * FROM clothes WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
  return rows.map(rowToItem);
}

export async function getCloth(id, userId) {
  const pool = getPool();
  const { rows } = await pool.query("SELECT * FROM clothes WHERE id = $1 AND user_id = $2", [id, userId]);
  return rows[0] ? rowToItem(rows[0]) : null;
}

export async function createCloth(data) {
  const pool = getPool();
  const { core, extra } = splitFields(data);
  const { rows } = await pool.query(
    `INSERT INTO clothes (id, user_id, category, image, store, size, price, memo, extra, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, now(), now())
     RETURNING *`,
    [
      data.userId,
      core.category,
      core.image || "",
      core.store || "",
      core.size || "",
      core.price ?? null,
      core.memo || "",
      extra,
    ]
  );
  return rowToItem(rows[0]);
}

export async function updateCloth(id, patch, userId) {
  const pool = getPool();
  const existing = await getCloth(id, userId);
  if (!existing) return null;

  const merged = { ...existing, ...patch };
  const { core, extra } = splitFields(merged);
  const { rows } = await pool.query(
    `UPDATE clothes SET category = $3, image = $4, store = $5, size = $6, price = $7, memo = $8, extra = $9, updated_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, core.category, core.image || "", core.store || "", core.size || "", core.price ?? null, core.memo || "", extra]
  );
  return rows[0] ? rowToItem(rows[0]) : null;
}

export async function deleteCloth(id, userId) {
  const pool = getPool();
  const existing = await getCloth(id, userId);
  if (!existing) return false;
  await pool.query("DELETE FROM clothes WHERE id = $1 AND user_id = $2", [id, userId]);
  return existing;
}
