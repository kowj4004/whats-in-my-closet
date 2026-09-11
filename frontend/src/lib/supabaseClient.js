// 프론트엔드용 Supabase 클라이언트(로그인/회원가입/세션 관리 전용).
// anon 키만 사용한다 — 옷/코디 데이터 자체는 여전히 백엔드 API(/api/...)를 거쳐서만 다룬다.

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
