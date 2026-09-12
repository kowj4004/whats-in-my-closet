// 계정 단위 설정(지금은 공유 on/off 하나뿐). user_settings 행이 아직 없으면 기본값을 돌려준다.

import { getPool } from "./postgresPool.js";

export async function getSettings(userId) {
  const pool = getPool();
  const { rows } = await pool.query("SELECT sharing_enabled FROM user_settings WHERE user_id = $1", [userId]);
  return { sharingEnabled: rows[0]?.sharing_enabled ?? false };
}

export async function updateSettings(userId, { sharingEnabled }) {
  const pool = getPool();
  await pool.query(
    `INSERT INTO user_settings (user_id, sharing_enabled, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (user_id) DO UPDATE SET sharing_enabled = $2, updated_at = now()`,
    [userId, sharingEnabled]
  );
  return { sharingEnabled };
}
