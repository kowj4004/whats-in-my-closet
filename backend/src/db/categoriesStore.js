// 카테고리는 코드 수정 없이 categories.json 파일만 편집하면 추가/변경할 수 있도록
// 별도 설정 파일로 분리한다. (예: { "id": "outer", "name": "아우터", "order": 4 } 추가)

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATEGORIES_FILE = path.join(__dirname, "..", "config", "categories.json");

export async function listCategories() {
  const raw = await fs.readFile(CATEGORIES_FILE, "utf-8");
  const categories = JSON.parse(raw);
  return categories.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getCategory(id) {
  const categories = await listCategories();
  return categories.find((c) => c.id === id) || null;
}
