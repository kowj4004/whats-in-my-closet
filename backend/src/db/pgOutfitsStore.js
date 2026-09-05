// jsonOutfitsStore.js와 동일한 인터페이스를 Postgres(Supabase)로 구현한 버전.

import { getPool } from "./postgresPool.js";

function rowToItem(row) {
  return {
    id: row.id,
    name: row.name,
    itemIds: row.item_ids,
    image: row.image,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listOutfits() {
  const pool = getPool();
  const { rows } = await pool.query("SELECT * FROM outfits ORDER BY created_at DESC");
  return rows.map(rowToItem);
}

export async function getOutfit(id) {
  const pool = getPool();
  const { rows } = await pool.query("SELECT * FROM outfits WHERE id = $1", [id]);
  return rows[0] ? rowToItem(rows[0]) : null;
}

export async function createOutfit({ name, itemIds, image }) {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO outfits (id, name, item_ids, image, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, now(), now())
     RETURNING *`,
    [name || "", JSON.stringify(itemIds), image || ""]
  );
  return rowToItem(rows[0]);
}

export async function updateOutfit(id, patch) {
  const pool = getPool();
  const existing = await getOutfit(id);
  if (!existing) return null;

  const merged = { ...existing, ...patch };
  const { rows } = await pool.query(
    `UPDATE outfits SET name = $2, item_ids = $3, image = $4, updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, merged.name || "", JSON.stringify(merged.itemIds), merged.image || ""]
  );
  return rows[0] ? rowToItem(rows[0]) : null;
}

export async function deleteOutfit(id) {
  const pool = getPool();
  const existing = await getOutfit(id);
  if (!existing) return false;
  await pool.query("DELETE FROM outfits WHERE id = $1", [id]);
  return true;
}
