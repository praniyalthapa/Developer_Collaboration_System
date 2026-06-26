import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

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
        target: "http://localhost:7777",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "http://localhost:7777",
        ws: true,
      },
    },
  },
});
