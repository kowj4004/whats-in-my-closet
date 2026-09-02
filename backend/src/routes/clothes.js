import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { finalizeUploadedImage, removeImageByUrl } from "../services/imageFile.js";
import { getCategory } from "../db/categoriesStore.js";
import {
  listClothes,
  getCloth,
  createCloth,
  updateCloth,
  deleteCloth,
} from "../db/clothesStore.js";

const router = Router();

// 데이터 구조상 필수로 관리하는 "코어" 필드. 그 외 필드는 자유롭게 추가로 저장된다.
const CORE_FIELDS = ["store", "size", "price", "memo"];

function pickExtraFields(body) {
  const extra = {};
  for (const [key, value] of Object.entries(body || {})) {
    if (key === "category" || key === "image") continue;
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
    const { category } = req.query;
    const items = await listClothes({ category: category || undefined });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const item = await getCloth(req.params.id);
    if (!item) return res.status(404).json({ error: "옷 정보를 찾을 수 없습니다." });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post("/", upload.single("image"), async (req, res, next) => {
  try {
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ error: "category는 필수입니다." });
    }
    const categoryInfo = await getCategory(category);
    if (!categoryInfo) {
      return res.status(400).json({ error: `존재하지 않는 카테고리입니다: ${category}` });
    }
    if (!req.file) {
      return res.status(400).json({ error: "옷 사진(image)은 필수입니다." });
    }

    const { imageUrl, processed, message } = await finalizeUploadedImage(req.file);

    const item = await createCloth({
      category,
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
    const existing = await getCloth(req.params.id);
    if (!existing) return res.status(404).json({ error: "옷 정보를 찾을 수 없습니다." });

    if (req.body.category) {
      const categoryInfo = await getCategory(req.body.category);
      if (!categoryInfo) {
        return res.status(400).json({ error: `존재하지 않는 카테고리입니다: ${req.body.category}` });
      }
    }

    const patch = { ...pickExtraFields(req.body) };
    if (req.body.category) patch.category = req.body.category;
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

    const updated = await updateCloth(req.params.id, patch);
    res.json({ item: updated, aiImageProcessing });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await getCloth(req.params.id);
    if (!existing) return res.status(404).json({ error: "옷 정보를 찾을 수 없습니다." });
    await deleteCloth(req.params.id);
    await removeImageByUrl(existing.image);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
