// Supabase Storage 기반 저장소. Render처럼 파일시스템이 매번 초기화되는 곳에 배포할 때
// 로컬 디스크 대신 사용한다. 버킷은 public으로 만들어 별도 서명 URL 없이 바로 <img src>로 쓴다.

import { createClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "closet-images";

let client;
function getClient() {
  if (!client) {
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return client;
}

export function isConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function uploadFile(buffer, filename, contentType) {
  const supabase = getClient();
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
  await getClient().storage.from(BUCKET).remove([objectPath]);
}
