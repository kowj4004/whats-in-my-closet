import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 백엔드(4000)로 /api, /uploads 요청을 프록시하여
// 프론트엔드에서는 항상 같은 오리진에서 호출하는 것처럼 개발할 수 있게 한다.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // 같은 Wi-Fi의 다른 기기(휴대폰 등)에서도 접속할 수 있도록 허용
    // Cloudflare Quick Tunnel(trycloudflare.com)로 외부 공개 시 Host 헤더 검증을 통과시키기 위함.
    // 매번 랜덤 서브도메인이 발급되므로 도메인 전체를 허용한다.
    allowedHosts: [".trycloudflare.com"],
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
