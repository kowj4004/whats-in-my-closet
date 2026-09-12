// 사용자별 카테고리 저장소. "세부카테고리"는 별도 테이블이 아니라 parent_id가 채워진
// category row일 뿐이다 — 최상위 카테고리와 완전히 같은 CRUD로 다룰 수 있다.

import { getPool } from "./postgresPool.js";

const DEFAULT_CATEGORIES = ["상의", "하의", "악세사리", "신발"];

function rowToItem(row) {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    image: row.image,
    order: row.sort_order,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

/** 이 사용자가 카테고리를 하나도 안 만들었으면(신규 가입 등) 기본 4개를 만들어준다. */
export async function ensureDefaultCategories(userId) {
  const pool = getPool();
  const { rows } = await pool.query("SELECT 1 FROM categories WHERE user_id = $1 LIMIT 1", [userId]);
  if (rows.length > 0) return;

  for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
    await pool.query(
      `INSERT INTO categories (user_id, name, sort_order) VALUES ($1, $2, $3)`,
      [userId, DEFAULT_CATEGORIES[i], i]
    );
  }
}

export async function listCategories(userId) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT * FROM categories WHERE user_id = $1
     ORDER BY (parent_id IS NOT NULL), sort_order, created_at`,
    [userId]
  );
  return rows.map(rowToItem);
}

export async function getCategory(id, userId) {
  const pool = getPool();
  const { rows } = await pool.query("SELECT * FROM categories WHERE id = $1 AND user_id = $2", [id, userId]);
  return rows[0] ? rowToItem(rows[0]) : null;
}

export async function createCategory({ userId, name, image, parentId, order }) {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO categories (user_id, parent_id, name, image, sort_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, parentId || null, name, image || "", order ?? 0]
  );
  return rowToItem(rows[0]);
}

export async function updateCategory(id, patch, userId) {
  const pool = getPool();
  const existing = await getCategory(id, userId);
  if (!existing) return null;

  const merged = { ...existing, ...patch };
  const { rows } = await pool.query(
    `UPDATE categories SET name = $3, image = $4, sort_order = $5, updated_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, merged.name, merged.image || "", merged.order ?? 0]
  );
  return rows[0] ? rowToItem(rows[0]) : null;
}

/** 하위 카테고리 id 목록(자기 자신 포함)을 반환한다. 삭제/필터링에 같이 쓴다. */
export async function getCategoryIdsIncludingChildren(id, userId) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT id FROM categories WHERE user_id = $2 AND (id = $1 OR parent_id = $1)`,
    [id, userId]
  );
  return rows.map((r) => r.id);
}

export async function deleteCategory(id, userId) {
  const pool = getPool();
  const existing = await getCategory(id, userId);
  if (!existing) return false;
  await pool.query("DELETE FROM categories WHERE id = $1 AND user_id = $2", [id, userId]);
  return true;
}
