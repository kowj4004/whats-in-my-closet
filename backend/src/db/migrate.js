// 서버 시작 시 한 번 호출되어 필요한 테이블이 없으면 만든다(멱등적).
// 별도 마이그레이션 도구 없이, MVP 단계에서는 이 정도로 충분하다.

import { getPool, isPostgresEnabled } from "./postgresPool.js";

export async function runMigrations() {
  if (!isPostgresEnabled()) return;

  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clothes (
      id UUID PRIMARY KEY,
      category TEXT NOT NULL,
      image TEXT NOT NULL DEFAULT '',
      store TEXT NOT NULL DEFAULT '',
      size TEXT NOT NULL DEFAULT '',
      price NUMERIC,
      memo TEXT NOT NULL DEFAULT '',
      extra JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS outfits (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      item_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      image TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
  `);

  console.log("[db] Postgres 마이그레이션 확인 완료");
}
