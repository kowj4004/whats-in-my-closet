// Supabase Storage 기반 저장소. Render처럼 파일시스템이 매번 초기화되는 곳에 배포할 때
// 로컬 디스크 대신 사용한다. 버킷은 public으로 만들어 별도 서명 URL 없이 바로 <img src>로 쓴다.

import { getSupabaseAdmin, isSupabaseConfigured } from "../supabaseAdmin.js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "closet-images";

export function isConfigured() {
  return isSupabaseConfigured();
}

export async function uploadFile(buffer, filename, contentType) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(BUCKET).upload(filename, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`Supabase Storage 업로드 실패: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

export async function deleteFile(url) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const objectPath = url.slice(idx + marker.length);
  await getSupabaseAdmin().storage.from(BUCKET).remove([objectPath]);
}
