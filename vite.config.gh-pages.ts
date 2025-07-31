import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { replaceImportsPlugin } from "./vite-plugin-replace-imports.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    themePlugin(),
    replaceImportsPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@/lib/api": path.resolve(__dirname, "client", "src", "lib", "api.gh-pages.ts"),
      "@/assets/logo": path.resolve(__dirname, "client", "src", "assets", "logo.gh-pages.tsx"),
      "@/lib/config": path.resolve(__dirname, "client", "src", "lib", "config.gh-pages.ts"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'client/index.gh-pages.html'),
      },
    },
  },
  base: '/',
});