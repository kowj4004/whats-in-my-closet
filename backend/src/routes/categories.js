import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { requireAuth } from "../middleware/auth.js";
import { finalizeCategoryImage, removeImageByUrl } from "../services/imageFile.js";
import {
  ensureDefaultCategories,
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryIdsIncludingChildren,
} from "../db/categoriesStore.js";
import { getPool } from "../db/postgresPool.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    await ensureDefaultCategories(req.userId); // 처음 가입한 사용자는 기본 4개를 자동으로 만들어준다
    const categories = await listCategories(req.userId);
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

router.post("/", upload.single("image"), async (req, res, next) => {
  try {
    const { name, parentId } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "카테고리 이름은 필수입니다." });
    }
    if (parentId) {
      const parent = await getCategory(parentId, req.userId);
      if (!parent) return res.status(400).json({ error: "존재하지 않는 상위 카테고리입니다." });
      if (parent.parentId) {
        return res.status(400).json({ error: "세부카테고리 안에 또 세부카테고리를 만들 수는 없습니다." });
      }
    }

    let image = "";
    if (req.file) {
      image = await finalizeCategoryImage(req.file);
    }

    const category = await createCategory({ userId: req.userId, name: name.trim(), image, parentId: parentId || null });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", upload.single("image"), async (req, res, next) => {
  try {
    const existing = await getCategory(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: "카테고리를 찾을 수 없습니다." });

    const patch = {};
    if (req.body.name !== undefined) {
      if (!req.body.name.trim()) return res.status(400).json({ error: "카테고리 이름은 비워둘 수 없습니다." });
      patch.name = req.body.name.trim();
    }
    if (req.body.order !== undefined) patch.order = Number(req.body.order) || 0;

    if (req.file) {
      patch.image = await finalizeCategoryImage(req.file);
      if (existing.image) await removeImageByUrl(existing.image);
    }

    const updated = await updateCategory(req.params.id, patch, req.userId);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await getCategory(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: "카테고리를 찾을 수 없습니다." });

    const relatedIds = await getCategoryIdsIncludingChildren(req.params.id, req.userId);
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT count(*) FROM clothes WHERE category_id = ANY($1::uuid[])`,
      [relatedIds]
    );
    if (Number(rows[0].count) > 0) {
      return res.status(400).json({
        error: "이 카테고리(또는 세부카테고리)에 등록된 옷이 있어 삭제할 수 없습니다. 먼저 옷을 다른 카테고리로 옮기거나 삭제해주세요.",
      });
    }

    await deleteCategory(req.params.id, req.userId);
    if (existing.image) await removeImageByUrl(existing.image);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
