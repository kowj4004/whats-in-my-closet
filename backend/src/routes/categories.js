import { Router } from "express";
import { listCategories } from "../db/categoriesStore.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const categories = await listCategories();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

export default router;
