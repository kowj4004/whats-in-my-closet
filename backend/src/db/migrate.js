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

    -- 카테고리 커스터마이징: 더 이상 전역 categories.json 하나를 모두가 공유하지 않고,
    -- 사용자마다 자기 카테고리를 만들고 이름/사진을 바꾸고 세부카테고리(자기참조 parent_id)를
    -- 둘 수 있게 한다. 세부카테고리도 그냥 parent_id가 채워진 category row일 뿐이라 테이블이 하나로 충분하다.
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      image TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS categories_user_id_idx ON categories(user_id);
    CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON categories(parent_id);

    -- 옷은 이제 "top" 같은 고정 문자열이 아니라 실제 categories 행(최상위 카테고리 또는
    -- 세부카테고리 둘 다 가능)을 가리킨다. 기존 문자열 category 컬럼은 과거 데이터 이전용으로
    -- 잠시 남겨두고, 이전이 끝나면 이후 커밋에서 제거한다.
    ALTER TABLE clothes ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS clothes_category_id_idx ON clothes(category_id);

    -- 공유 기능: 계정 단위 on/off 토글 + (나중에 필요하면 확장할) 설정들을 위한 자리.
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      sharing_enabled BOOLEAN NOT NULL DEFAULT false,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- 예전 "top/bottom/accessory/shoes" 고정 문자열 컬럼은 scripts/migrate-categories-to-db.js로
    -- category_id 이전이 끝났으므로 더 이상 필요 없다.
    ALTER TABLE clothes DROP COLUMN IF EXISTS category;
  `);

  console.log("[db] Postgres 마이그레이션 확인 완료");
}
