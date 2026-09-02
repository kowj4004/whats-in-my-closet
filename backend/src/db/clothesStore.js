// 매우 단순한 JSON 파일 기반 데이터 저장소.
// MVP 단계에서는 별도의 DB 서버 없이 파일 하나로 옷 데이터를 관리한다.
// 추후 실제 DB(SQLite/Postgres 등)로 교체하더라도, 이 모듈이 제공하는
// list/get/create/update/remove 인터페이스만 동일하게 구현하면 나머지 코드는 수정할 필요가 없다.

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "..", "data", "clothes.json");

// 동시 쓰기로 인한 데이터 유실을 막기 위한 아주 단순한 순차 실행 큐
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

export async function listClothes({ category } = {}) {
  const all = await readAll();
  const filtered = category ? all.filter((c) => c.category === category) : all;
  // 최신 등록 순으로 정렬
  return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getCloth(id) {
  const all = await readAll();
  return all.find((c) => c.id === id) || null;
}

export async function createCloth(data) {
  return enqueue(async () => {
    const all = await readAll();
    const now = new Date().toISOString();
    const item = {
      id: randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    all.push(item);
    await writeAll(all);
    return item;
  });
}

export async function updateCloth(id, patch) {
  return enqueue(async () => {
    const all = await readAll();
    const idx = all.findIndex((c) => c.id === id);
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

export async function deleteCloth(id) {
  return enqueue(async () => {
    const all = await readAll();
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    const [removed] = all.splice(idx, 1);
    await writeAll(all);
    return removed;
  });
}
