import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 백엔드(4000)로 /api, /uploads 요청을 프록시하여
// 프론트엔드에서는 항상 같은 오리진에서 호출하는 것처럼 개발할 수 있게 한다.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
