// 프론트가 Supabase Auth로 로그인해서 받은 access token을
// Authorization: Bearer <token> 헤더로 보내면, Supabase에 물어봐서 검증한다.
// 통과하면 req.userId/req.userEmail을 채워서 이후 라우트가 자신의 데이터만 다루게 한다.

import { getSupabaseAdmin } from "../services/supabaseAdmin.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }

  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "로그인이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요." });
  }

  req.userId = data.user.id;
  req.userEmail = data.user.email;
  next();
}
