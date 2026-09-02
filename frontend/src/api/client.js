// 백엔드 API를 호출하는 얇은 클라이언트 레이어.
// 컴포넌트는 fetch를 직접 다루지 않고 이 함수들만 사용한다.

async function handleResponse(res) {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `요청에 실패했습니다. (${res.status})`);
  }
  return data;
}

export function getCategories() {
  return fetch("/api/categories").then(handleResponse);
}

export function getClothes(category) {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  return fetch(`/api/clothes${query}`).then(handleResponse);
}

export function getCloth(id) {
  return fetch(`/api/clothes/${id}`).then(handleResponse);
}

/**
 * @param {object} fields { category, store, size, price, memo, imageFile }
 */
export function createCloth(fields) {
  const formData = buildFormData(fields);
  return fetch("/api/clothes", { method: "POST", body: formData }).then(handleResponse);
}

export function updateCloth(id, fields) {
  const formData = buildFormData(fields);
  return fetch(`/api/clothes/${id}`, { method: "PUT", body: formData }).then(handleResponse);
}

export function deleteCloth(id) {
  return fetch(`/api/clothes/${id}`, { method: "DELETE" }).then(handleResponse);
}

/** 캡처한 이미지에서 옷 정보를 AI/OCR로 추출한다 (저장하지 않음). */
export function extractClothInfo(imageFile) {
  const formData = new FormData();
  formData.append("image", imageFile);
  return fetch("/api/ai/extract", { method: "POST", body: formData }).then(handleResponse);
}

export function getOutfits() {
  return fetch("/api/outfits").then(handleResponse);
}

export function getOutfit(id) {
  return fetch(`/api/outfits/${id}`).then(handleResponse);
}

/** @param {object} fields { name, itemIds } */
export function createOutfit(fields) {
  return fetch("/api/outfits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  }).then(handleResponse);
}

export function updateOutfit(id, fields) {
  return fetch(`/api/outfits/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  }).then(handleResponse);
}

export function deleteOutfit(id) {
  return fetch(`/api/outfits/${id}`, { method: "DELETE" }).then(handleResponse);
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
