import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { requireAuth } from "../middleware/auth.js";
import { finalizeUploadedImage, removeImageByUrl } from "../services/imageFile.js";
import { getCategory, getCategoryIdsIncludingChildren } from "../db/categoriesStore.js";
import {
  listClothes,
  getCloth,
  createCloth,
  updateCloth,
  deleteCloth,
} from "../db/clothesStore.js";

const router = Router();
router.use(requireAuth); // 이 아래 전부 로그인한 사용자만, 자기 옷만 다룬다

// 데이터 구조상 필수로 관리하는 "코어" 필드. 그 외 필드는 자유롭게 추가로 저장된다.
function pickExtraFields(body) {
  const extra = {};
  for (const [key, value] of Object.entries(body || {})) {
    if (key === "categoryId" || key === "image") continue;
    extra[key] = value;
  }
  return extra;
}

function normalizePrice(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

router.get("/", async (req, res, next) => {
  try {
    const { categoryId } = req.query;
    // 최상위 카테고리를 보고 있으면 그 세부카테고리에 속한 옷들도 같이 보여준다.
    const categoryIds = categoryId ? await getCategoryIdsIncludingChildren(categoryId, req.userId) : undefined;
    const items = await listClothes({ categoryIds, userId: req.userId });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const item = await getCloth(req.params.id, req.userId);
    if (!item) return res.status(404).json({ error: "옷 정보를 찾을 수 없습니다." });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post("/", upload.single("image"), async (req, res, next) => {
  try {
    const { categoryId } = req.body;
    if (!categoryId) {
      return res.status(400).json({ error: "categoryId는 필수입니다." });
    }
    const categoryInfo = await getCategory(categoryId, req.userId);
    if (!categoryInfo) {
      return res.status(400).json({ error: `존재하지 않는 카테고리입니다: ${categoryId}` });
    }
    if (!req.file) {
      return res.status(400).json({ error: "옷 사진(image)은 필수입니다." });
    }

    const { imageUrl, processed, message } = await finalizeUploadedImage(req.file);

    const item = await createCloth({
      userId: req.userId,
      categoryId,
      image: imageUrl,
      store: req.body.store || "",
      size: req.body.size || "",
      price: normalizePrice(req.body.price),
      memo: req.body.memo || "",
      ...pickExtraFields(req.body),
    });

    res.status(201).json({ item, aiImageProcessing: { processed, message } });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", upload.single("image"), async (req, res, next) => {
  try {
    const existing = await getCloth(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: "옷 정보를 찾을 수 없습니다." });

    if (req.body.categoryId) {
      const categoryInfo = await getCategory(req.body.categoryId, req.userId);
      if (!categoryInfo) {
        return res.status(400).json({ error: `존재하지 않는 카테고리입니다: ${req.body.categoryId}` });
      }
    }

    const patch = { ...pickExtraFields(req.body) };
    if (req.body.categoryId) patch.categoryId = req.body.categoryId;
    if (req.body.store !== undefined) patch.store = req.body.store;
    if (req.body.size !== undefined) patch.size = req.body.size;
    if (req.body.price !== undefined) patch.price = normalizePrice(req.body.price);
    if (req.body.memo !== undefined) patch.memo = req.body.memo;

    let aiImageProcessing = null;
    if (req.file) {
      const result = await finalizeUploadedImage(req.file);
      patch.image = result.imageUrl;
      aiImageProcessing = { processed: result.processed, message: result.message };
      await removeImageByUrl(existing.image);
    }

    const updated = await updateCloth(req.params.id, patch, req.userId);
    res.json({ item: updated, aiImageProcessing });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await getCloth(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: "옷 정보를 찾을 수 없습니다." });
    await deleteCloth(req.params.id, req.userId);
    await removeImageByUrl(existing.image);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
