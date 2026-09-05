// DATABASE_URL이 설정되어 있으면 Postgres(Supabase)를, 없으면 로컬 JSON 파일을
// 사용하도록 하는 스위치의 기준점. AI provider들의 resolveProvider() 패턴과 동일한 방식.

import pg from "pg";

const { Pool } = pg;

let pool;

export function isPostgresEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  }
  return pool;
}
