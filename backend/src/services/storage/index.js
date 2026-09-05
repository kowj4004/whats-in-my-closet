// 이미지 저장소 스위처. SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY가 설정되어 있으면 Supabase
// Storage를, 없으면 로컬 디스크(backend/uploads)를 사용한다. AI provider들과 같은 패턴.
//
// delete/read는 URL 모양(로컬 "/uploads/..." vs Supabase의 절대 URL)을 보고 알맞은 구현으로
// 위임한다 — 저장 방식을 전환한 뒤에도 이전에 만들어진 파일을 계속 정리/조회할 수 있어야 하기 때문.

import * as local from "./localStorage.js";
import * as supabase from "./supabaseStorage.js";

export function isRemoteStorageEnabled() {
  return supabase.isConfigured();
}

/** @returns {Promise<string>} 저장된 파일의 URL (로컬은 "/uploads/..", 원격은 절대 URL) */
export async function uploadFile(buffer, filename, contentType) {
  if (isRemoteStorageEnabled()) {
    return supabase.uploadFile(buffer, filename, contentType);
  }
  return local.uploadFile(buffer, filename);
}

export async function deleteFile(url) {
  if (!url) return;
  if (url.startsWith("/uploads/")) return local.deleteFile(url);
  return supabase.deleteFile(url).catch(() => {});
}

export async function readFile(url) {
  if (url.startsWith("/uploads/")) return local.readFile(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`이미지를 불러오지 못했습니다: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}
