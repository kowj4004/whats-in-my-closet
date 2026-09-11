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

    -- 로그인 도입: 옷/코디에 소유자(user_id)를 붙인다. 기존 데이터가 있을 수 있어 일단 NULL 허용 —
    -- 첫 사용자가 가입하면 마이그레이션 스크립트로 기존 데이터를 그 계정에 붙여준다.
    -- is_public은 나중에 만들 SNS형 "옷장 공유/게시" 기능을 위한 사전 준비(지금은 미사용, 기본 비공개).
    ALTER TABLE clothes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    ALTER TABLE clothes ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;
    CREATE INDEX IF NOT EXISTS clothes_user_id_idx ON clothes(user_id);

    ALTER TABLE outfits ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    ALTER TABLE outfits ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;
    CREATE INDEX IF NOT EXISTS outfits_user_id_idx ON outfits(user_id);

    -- RLS는 지금의 Express 백엔드(postgres 역할, RLS 우회)에는 영향이 없지만, 나중에 프론트가
    -- Supabase를 직접 읽는 공개 피드를 만들 때를 대비해 미리 켜두고 공개 글만 읽히게 해둔다.
    ALTER TABLE clothes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS clothes_public_read ON clothes;
    CREATE POLICY clothes_public_read ON clothes FOR SELECT USING (is_public = true);

    DROP POLICY IF EXISTS outfits_public_read ON outfits;
    CREATE POLICY outfits_public_read ON outfits FOR SELECT USING (is_public = true);
  `);

  console.log("[db] Postgres 마이그레이션 확인 완료");
}
