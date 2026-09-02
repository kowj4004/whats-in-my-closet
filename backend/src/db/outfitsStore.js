// 코디(outfit)는 새 사진을 올리지 않고, 이미 등록된 옷들의 id 조합만 저장하는
// 별도의 JSON 파일 저장소다. clothesStore.js와 동일한 큐 기반 쓰기 패턴을 따른다.

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "..", "data", "outfits.json");

let writeQueue = Promise.resolve();
function enqueue(task) {
  const result = writeQueue.then(task, task);
  writeQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

async function readAll() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeAll(items) {
  const tmpFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(items, null, 2), "utf-8");
  await fs.rename(tmpFile, DATA_FILE);
}

export async function listOutfits() {
  const all = await readAll();
  return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getOutfit(id) {
  const all = await readAll();
  return all.find((o) => o.id === id) || null;
}

export async function createOutfit({ name, itemIds }) {
  return enqueue(async () => {
    const all = await readAll();
    const now = new Date().toISOString();
    const item = {
      id: randomUUID(),
      name: name || "",
      itemIds,
      createdAt: now,
      updatedAt: now,
    };
    all.push(item);
    await writeAll(all);
    return item;
  });
}

export async function updateOutfit(id, patch) {
  return enqueue(async () => {
    const all = await readAll();
    const idx = all.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    const updated = {
      ...all[idx],
      ...patch,
      id: all[idx].id,
      createdAt: all[idx].createdAt,
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updated;
    await writeAll(all);
    return updated;
  });
}

export async function deleteOutfit(id) {
  return enqueue(async () => {
    const all = await readAll();
    const idx = all.findIndex((o) => o.id === id);
    if (idx === -1) return false;
    all.splice(idx, 1);
    await writeAll(all);
    return true;
  });
}
