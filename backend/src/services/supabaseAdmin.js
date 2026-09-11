// Supabase 관리자 클라이언트(service_role 키 사용) 단일 인스턴스.
// Storage 업로드/삭제와 로그인 토큰 검증(auth.getUser)에서 공용으로 쓴다.

import { createClient } from "@supabase/supabase-js";

let client;

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdmin() {
  if (!client) {
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return client;
}
