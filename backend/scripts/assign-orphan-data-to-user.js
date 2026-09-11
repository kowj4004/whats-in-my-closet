// 1회성 스크립트: 로그인 기능 도입 전에 만들어진 소유자 없는(user_id IS NULL) 옷/코디를
// 특정 사용자 계정으로 귀속시킨다. 사용법:
//   node scripts/assign-orphan-data-to-user.js <이메일>
// (Supabase Auth에 실제 가입된 이메일이어야 한다.)

import "dotenv/config";
import { getSupabaseAdmin } from "../src/services/supabaseAdmin.js";
import { getPool, isPostgresEnabled } from "../src/db/postgresPool.js";

async function findUserIdByEmail(email) {
  const supabase = getSupabaseAdmin();
  // listUsers는 대량 사용자 대비 페이지네이션이 있지만, 개인 프로젝트 규모라 1페이지면 충분하다.
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  const user = data.users.find((u) => u.email === email);
  if (!user) throw new Error(`가입된 사용자를 찾을 수 없습니다: ${email}`);
  return user.id;
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.log("사용법: node scripts/assign-orphan-data-to-user.js <이메일>");
    return;
  }
  if (!isPostgresEnabled()) {
    console.log("DATABASE_URL이 설정되어 있지 않습니다.");
    return;
  }

  const userId = await findUserIdByEmail(email);
  console.log(`대상 사용자: ${email} (${userId})`);

  const pool = getPool();
  const clothes = await pool.query("UPDATE clothes SET user_id = $1 WHERE user_id IS NULL RETURNING id", [userId]);
  const outfits = await pool.query("UPDATE outfits SET user_id = $1 WHERE user_id IS NULL RETURNING id", [userId]);

  console.log(`clothes ${clothes.rowCount}개, outfits ${outfits.rowCount}개를 이 계정으로 이전했습니다.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
