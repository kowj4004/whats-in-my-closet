import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getCloth } from "../db/clothesStore.js";
import {
  listOutfits,
  getOutfit,
  createOutfit,
  updateOutfit,
  deleteOutfit,
} from "../db/outfitsStore.js";
import { composeOutfitImage, removeComposedImage } from "../services/outfitComposer.js";

const router = Router();
router.use(requireAuth); // 이 아래 전부 로그인한 사용자만, 자기 코디만 다룬다

// 코디에 포함된 itemIds를 실제 옷 정보(이미지/구매처 등)로 채워서 응답한다.
// 등록된 옷이 그사이 삭제된 경우 해당 id는 결과에서 조용히 제외한다.
async function withItems(outfit, userId) {
  const items = await Promise.all(outfit.itemIds.map((id) => getCloth(id, userId)));
  return { ...outfit, items: items.filter(Boolean) };
}

router.get("/", async (req, res, next) => {
  try {
    const outfits = await listOutfits(req.userId);
    res.json(await Promise.all(outfits.map((o) => withItems(o, req.userId))));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const outfit = await getOutfit(req.params.id, req.userId);
    if (!outfit) return res.status(404).json({ error: "코디를 찾을 수 없습니다." });
    res.json(await withItems(outfit, req.userId));
  } catch (err) {
    next(err);
  }
});

/** itemIds 유효성을 검사하고, 문제 없으면 실제 옷 레코드 배열을 반환한다. */
async function resolveItems(itemIds, userId) {
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return { error: "옷을 하나 이상 선택해주세요." };
  }
  const items = [];
  for (const id of itemIds) {
    const cloth = await getCloth(id, userId);
    if (!cloth) return { error: `존재하지 않는 옷입니다: ${id}` };
    items.push(cloth);
  }
  return { items };
}

router.post("/", async (req, res, next) => {
  try {
    const { name, itemIds } = req.body;
    const { error, items } = await resolveItems(itemIds, req.userId);
    if (error) return res.status(400).json({ error });

    const image = await composeOutfitImage(items);
    const outfit = await createOutfit({ name, itemIds, image, userId: req.userId });
    res.status(201).json(await withItems(outfit, req.userId));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const existing = await getOutfit(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: "코디를 찾을 수 없습니다." });

    const patch = {};
    if (req.body.name !== undefined) patch.name = req.body.name;
    if (req.body.itemIds !== undefined) {
      const { error, items } = await resolveItems(req.body.itemIds, req.userId);
      if (error) return res.status(400).json({ error });
      patch.itemIds = req.body.itemIds;
      patch.image = await composeOutfitImage(items);
    }

    const updated = await updateOutfit(req.params.id, patch, req.userId);
    if (patch.image) await removeComposedImage(existing.image);

    res.json(await withItems(updated, req.userId));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await getOutfit(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: "코디를 찾을 수 없습니다." });
    await deleteOutfit(req.params.id, req.userId);
    await removeComposedImage(existing.image);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
