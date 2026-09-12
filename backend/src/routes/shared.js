// 다른 사람의 이메일을 알면(그리고 그 사람이 공유를 켜뒀으면) 옷장을 "열람"만 할 수 있는 라우트.
// 여기서 나가는 데이터는 전부 읽기 전용 — 수정/삭제 엔드포인트는 이 파일에 없다(만들지 않았다).
// 요청자 자신도 로그인은 되어 있어야 한다(완전 공개 인터넷 노출은 아님).

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getPool } from "../db/postgresPool.js";
import { getSettings } from "../db/userSettingsStore.js";
import { listCategories } from "../db/categoriesStore.js";
import { listClothes, getCloth } from "../db/clothesStore.js";
import { listOutfits } from "../db/outfitsStore.js";

const router = Router();
router.use(requireAuth);

async function findUserIdByEmail(email) {
  const pool = getPool();
  const { rows } = await pool.query("SELECT id FROM auth.users WHERE email = $1", [email]);
  return rows[0]?.id || null;
}

router.get("/:email", async (req, res, next) => {
  try {
    const targetUserId = await findUserIdByEmail(req.params.email);
    // 존재하지 않는 이메일과 "공유를 꺼둔 계정"을 구분해서 알려주지 않는다(이메일 존재 여부 추측 방지).
    if (!targetUserId) {
      return res.status(404).json({ error: "옷장을 찾을 수 없거나 공개되어 있지 않습니다." });
    }
    const settings = await getSettings(targetUserId);
    if (!settings.sharingEnabled) {
      return res.status(404).json({ error: "옷장을 찾을 수 없거나 공개되어 있지 않습니다." });
    }

    const [categories, clothes, outfits] = await Promise.all([
      listCategories(targetUserId),
      listClothes({ userId: targetUserId }),
      listOutfits(targetUserId),
    ]);

    const outfitsWithItems = await Promise.all(
      outfits.map(async (outfit) => {
        const items = await Promise.all(outfit.itemIds.map((id) => getCloth(id, targetUserId)));
        return { ...outfit, items: items.filter(Boolean) };
      })
    );

    res.json({ email: req.params.email, categories, clothes, outfits: outfitsWithItems });
  } catch (err) {
    next(err);
  }
});

export default router;
