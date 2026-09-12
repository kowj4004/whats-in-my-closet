import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getSettings, updateSettings } from "../db/userSettingsStore.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    res.json(await getSettings(req.userId));
  } catch (err) {
    next(err);
  }
});

router.put("/", async (req, res, next) => {
  try {
    res.json(await updateSettings(req.userId, { sharingEnabled: Boolean(req.body.sharingEnabled) }));
  } catch (err) {
    next(err);
  }
});

export default router;
