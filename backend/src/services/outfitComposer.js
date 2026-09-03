// 코디(outfit)에 포함된 옷 사진들을 한 장의 이미지로 합성한다. 생성형 AI가 필요 없는
// 순수 이미지 합성 작업이라 sharp만으로 처리한다. 옷이 바뀔 때마다(생성/수정) 다시
// 합성해서 uploads 디렉터리에 저장하고, 이전 합성 파일은 지운다.

import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { UPLOAD_DIR } from "../middleware/upload.js";

const CELL = 500; // 옷 한 장이 차지하는 정사각형 칸 크기(px)
const MAX_ITEMS = 4;

function layoutFor(count) {
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count === 2) return { cols: 2, rows: 1 };
  return { cols: 2, rows: 2 };
}

/**
 * @param {Array<{ image?: string }>} items 코디에 포함된 옷들(clothesStore 레코드)
 * @returns {Promise<string>} 합성된 이미지의 /uploads/... URL
 */
export async function composeOutfitImage(items) {
  const used = items.filter((item) => item.image).slice(0, MAX_ITEMS);
  if (used.length === 0) {
    throw new Error("합성할 이미지가 있는 옷이 없습니다.");
  }
  const { cols, rows } = layoutFor(used.length);

  const cells = await Promise.all(
    used.map(async (item) => {
      const filePath = path.join(UPLOAD_DIR, item.image.replace("/uploads/", ""));
      const buffer = await fs.readFile(filePath);
      return sharp(buffer).resize(CELL, CELL, { fit: "cover" }).toBuffer();
    })
  );

  const composite = cells.map((input, i) => ({
    input,
    left: (i % cols) * CELL,
    top: Math.floor(i / cols) * CELL,
  }));

  const outputBuffer = await sharp({
    create: {
      width: CELL * cols,
      height: CELL * rows,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite(composite)
    .png()
    .toBuffer();

  const filename = `outfit-${randomUUID()}.png`;
  await fs.writeFile(path.join(UPLOAD_DIR, filename), outputBuffer);
  return `/uploads/${filename}`;
}

/** 코디 합성 이미지 URL로부터 실제 파일을 삭제한다. 없어도 에러를 던지지 않는다. */
export async function removeComposedImage(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) return;
  const filePath = path.join(UPLOAD_DIR, imageUrl.replace("/uploads/", ""));
  await fs.unlink(filePath).catch(() => {});
}
