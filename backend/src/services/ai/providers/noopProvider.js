// AI 기능을 사용할 수 없을 때(예: API 키 미설정)의 안전한 폴백 구현.
// 배경 제거는 원본 이미지를 그대로 반환하고, 정보 추출은 빈 값을 반환하여
// 사용자가 수기로 입력할 수 있도록 한다. 서비스 자체가 중단되지 않는 것이 핵심이다.

export async function noopRemoveBackground(buffer, mimeType) {
  return { buffer, mimeType };
}

export async function noopExtractInfo() {
  return { store: "", size: "", price: null, memo: "" };
}
