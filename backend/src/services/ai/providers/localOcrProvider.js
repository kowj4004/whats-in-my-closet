// 외부 AI 호출 없이 Tesseract(오픈소스 OCR 엔진)로 이미지에서 글자를 읽고,
// 정규식으로 가격/사이즈 패턴만 뽑아낸다. 구매처처럼 정형화되지 않은 값은
// 정규식으로 신뢰성 있게 뽑기 어려워 비워두고, 인식된 원문 전체를 메모에 담아
// 사용자가 눈으로 보고 직접 채우도록 한다.

import { createWorker } from "tesseract.js";

const LETTER_SIZE_TOKEN = /\b(XXS|XS|S|M|L|XL|XXL|XXXL|FREE)\b/i;
// 순수 숫자(2~3자리)는 상품코드/할인율/가격 조각 등과 구분이 안 되므로,
// "사이즈"라는 라벨이 근처에 있거나 신발 사이즈 단위(mm/호)가 붙어 있을 때만 인정한다.
const LABELED_NUMERIC_SIZE = /사이즈\s*[:\-]?\s*([0-9]{2,3})|(?:^|\s)([0-9]{2,3})\s*(?:mm|호)\b/i;
const PRICE_TOKEN = /(\d{1,3}(?:,\d{3})+|\d{4,7})\s*원/;

function parseFields(rawText) {
  const text = rawText.replace(/\s+/g, " ").trim();

  const priceMatch = text.match(PRICE_TOKEN);
  const price = priceMatch ? Number(priceMatch[1].replace(/,/g, "")) : null;

  const letterMatch = text.match(LETTER_SIZE_TOKEN);
  const numericMatch = text.match(LABELED_NUMERIC_SIZE);
  const size = letterMatch
    ? letterMatch[1].toUpperCase()
    : numericMatch
      ? numericMatch[1] || numericMatch[2]
      : "";

  return {
    store: "",
    size,
    price,
    memo: text.slice(0, 300),
  };
}

export async function localExtractInfo(buffer) {
  const worker = await createWorker("kor+eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(buffer);
    return parseFields(text);
  } finally {
    await worker.terminate();
  }
}
