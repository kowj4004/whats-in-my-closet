import { Router } from "express";
import multer from "multer";
import { extractClothInfo } from "../services/ai/ocrExtractor.js";

// 정보 추출 전용 엔드포인트는 확정 저장 전 단계이므로 디스크에 파일을 남기지 않고
// 메모리에서만 처리한다(사용자가 확인/수정 후 실제 저장할 때 다시 업로드된다).
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("이미지 파일만 업로드할 수 있습니다."));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

// 캡처한 이미지에서 옷 정보를 추출한다. 결과는 저장되지 않으며,
// 프론트엔드가 사용자 확인/수정 화면에 프리필하는 용도로만 사용한다.
router.post("/extract", memoryUpload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "분석할 이미지(image)가 필요합니다." });
    }
    const result = await extractClothInfo(req.file.buffer, req.file.mimetype);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
