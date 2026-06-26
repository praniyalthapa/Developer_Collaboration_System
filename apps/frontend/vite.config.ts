import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const backendProxyTarget = process.env.BACKEND_PROXY || "http://localhost:7777";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: backendProxyTarget,
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: backendProxyTarget,
        ws: true,
      },
    },
  },
});
