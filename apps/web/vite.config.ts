import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const packagesDir = path.resolve(rootDir, "../../packages");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    conditions: ["development", "import", "module", "browser", "default"],
    alias: {
      "@": path.resolve(rootDir, "./src"),
      "@morphix/media": path.resolve(packagesDir, "media/src/index.ts"),
      "@morphix/shared": path.resolve(packagesDir, "shared/src/index.ts"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    fs: {
      allow: [rootDir, packagesDir],
    },
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
        ws: true,
      },
      "/uploads": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
