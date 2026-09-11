// jsonOutfitsStore.js와 동일한 인터페이스를 Postgres(Supabase)로 구현한 버전.
// 모든 조회/수정/삭제는 user_id로 스코프된다 — 로그인한 사용자는 자기 코디만 보고 건드릴 수 있다.

import { getPool } from "./postgresPool.js";

function rowToItem(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    itemIds: row.item_ids,
    image: row.image,
    isPublic: row.is_public,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listOutfits(userId) {
  const pool = getPool();
  const { rows } = await pool.query("SELECT * FROM outfits WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
  return rows.map(rowToItem);
}

export async function getOutfit(id, userId) {
  const pool = getPool();
  const { rows } = await pool.query("SELECT * FROM outfits WHERE id = $1 AND user_id = $2", [id, userId]);
  return rows[0] ? rowToItem(rows[0]) : null;
}

export async function createOutfit({ name, itemIds, image, userId }) {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO outfits (id, user_id, name, item_ids, image, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, now(), now())
     RETURNING *`,
    [userId, name || "", JSON.stringify(itemIds), image || ""]
  );
  return rowToItem(rows[0]);
}

export async function updateOutfit(id, patch, userId) {
  const pool = getPool();
  const existing = await getOutfit(id, userId);
  if (!existing) return null;

  const merged = { ...existing, ...patch };
  const { rows } = await pool.query(
    `UPDATE outfits SET name = $3, item_ids = $4, image = $5, updated_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, merged.name || "", JSON.stringify(merged.itemIds), merged.image || ""]
  );
  return rows[0] ? rowToItem(rows[0]) : null;
}

export async function deleteOutfit(id, userId) {
  const pool = getPool();
  const existing = await getOutfit(id, userId);
  if (!existing) return false;
  await pool.query("DELETE FROM outfits WHERE id = $1 AND user_id = $2", [id, userId]);
  return true;
}
