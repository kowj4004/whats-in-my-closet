// 백엔드 API를 호출하는 얇은 클라이언트 레이어.
// 컴포넌트는 fetch를 직접 다루지 않고 이 함수들만 사용한다.

import { supabase } from "../lib/supabaseClient.js";

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** 로그인 토큰을 자동으로 붙여주는 fetch. 옷/코디 관련 API는 전부 로그인이 필요하다. */
async function authFetch(url, options = {}) {
  const headers = { ...(options.headers || {}), ...(await authHeaders()) };
  return fetch(url, { ...options, headers });
}

async function handleResponse(res) {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `요청에 실패했습니다. (${res.status})`);
  }
  return data;
}

// 카테고리는 이제 사용자마다 직접 커스터마이징하는 데이터라 로그인이 필요하다.
export function getCategories() {
  return authFetch("/api/categories").then(handleResponse);
}

/** @param {object} fields { name, parentId, imageFile } */
export function createCategory(fields) {
  const formData = buildFormData(fields);
  return authFetch("/api/categories", { method: "POST", body: formData }).then(handleResponse);
}

export function updateCategory(id, fields) {
  const formData = buildFormData(fields);
  return authFetch(`/api/categories/${id}`, { method: "PUT", body: formData }).then(handleResponse);
}

export function deleteCategory(id) {
  return authFetch(`/api/categories/${id}`, { method: "DELETE" }).then(handleResponse);
}

export function getClothes(categoryId) {
  const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : "";
  return authFetch(`/api/clothes${query}`).then(handleResponse);
}

export function getCloth(id) {
  return authFetch(`/api/clothes/${id}`).then(handleResponse);
}

/**
 * @param {object} fields { categoryId, store, size, price, memo, imageFile }
 */
export function createCloth(fields) {
  const formData = buildFormData(fields);
  return authFetch("/api/clothes", { method: "POST", body: formData }).then(handleResponse);
}

export function updateCloth(id, fields) {
  const formData = buildFormData(fields);
  return authFetch(`/api/clothes/${id}`, { method: "PUT", body: formData }).then(handleResponse);
}

export function deleteCloth(id) {
  return authFetch(`/api/clothes/${id}`, { method: "DELETE" }).then(handleResponse);
}

/** 캡처한 이미지에서 옷 정보를 AI/OCR로 추출한다 (저장하지 않음). */
export function extractClothInfo(imageFile) {
  const formData = new FormData();
  formData.append("image", imageFile);
  return authFetch("/api/ai/extract", { method: "POST", body: formData }).then(handleResponse);
}

export function getOutfits() {
  return authFetch("/api/outfits").then(handleResponse);
}

export function getOutfit(id) {
  return authFetch(`/api/outfits/${id}`).then(handleResponse);
}

/** @param {object} fields { name, itemIds } */
export function createOutfit(fields) {
  return authFetch("/api/outfits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  }).then(handleResponse);
}

export function updateOutfit(id, fields) {
  return authFetch(`/api/outfits/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  }).then(handleResponse);
}

export function deleteOutfit(id) {
  return authFetch(`/api/outfits/${id}`, { method: "DELETE" }).then(handleResponse);
}

export function getSettings() {
  return authFetch("/api/settings").then(handleResponse);
}

/** @param {object} fields { sharingEnabled } */
export function updateSettings(fields) {
  return authFetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  }).then(handleResponse);
}

/** 상대방이 공유를 켜뒀을 때만 그 사람의 옷장을 읽기 전용으로 가져온다. */
export function getSharedCloset(email) {
  return authFetch(`/api/shared/${encodeURIComponent(email)}`).then(handleResponse);
}

function buildFormData(fields) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (key === "imageFile") {
      if (value) formData.append("image", value);
      return;
    }
    if (value === undefined || value === null) return;
    formData.append(key, value);
  });
  return formData;
}
