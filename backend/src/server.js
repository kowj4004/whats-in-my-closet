import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import categoriesRouter from "./routes/categories.js";
import clothesRouter from "./routes/clothes.js";
import outfitsRouter from "./routes/outfits.js";
import aiRouter from "./routes/ai.js";
import settingsRouter from "./routes/settings.js";
import sharedRouter from "./routes/shared.js";
import { UPLOAD_DIR } from "./middleware/upload.js";
import { runMigrations } from "./db/migrate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// uploads 디렉터리가 없으면 생성 (최초 실행 대비)
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 업로드된 옷 이미지를 정적으로 서빙
app.use("/uploads", express.static(UPLOAD_DIR));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/categories", categoriesRouter);
app.use("/api/clothes", clothesRouter);
app.use("/api/outfits", outfitsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/shared", sharedRouter);

// 404 핸들러
app.use("/api", (req, res) => {
  res.status(404).json({ error: "요청한 API를 찾을 수 없습니다." });
});

// 프로덕션 배포용: 프론트엔드 빌드 결과물(frontend/dist)이 있으면 정적으로 서빙하고,
// API가 아닌 나머지 경로는 전부 index.html로 돌려서 React Router(SPA)가 처리하게 한다.
// 로컬 개발 중에는 dist가 없으므로(Vite 개발 서버가 5173에서 따로 서빙) 아무 영향 없다.
const frontendDist = path.join(__dirname, "..", "..", "frontend", "dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// 공통 에러 핸들러 (multer 에러 포함)
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 400;
  res.status(status).json({ error: err.message || "서버 오류가 발생했습니다." });
});

runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[closet-backend] listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[db] 마이그레이션 실패:", err.message);
    process.exit(1);
  });
