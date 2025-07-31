import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    plugins: [
        react(),
        themePlugin(),
    ],
      resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@/lib/api": path.resolve(__dirname, "client", "src", "lib", "api.gh-pages.ts"),
      "@/lib/constants": path.resolve(__dirname, "client", "src", "lib", "constants.gh-pages.ts"),
      "@/assets/logo": path.resolve(__dirname, "client", "src", "assets", "logo.gh-pages.tsx"),
      "@/components/layout/layout": path.resolve(__dirname, "client", "src", "components", "layout", "layout.gh-pages.tsx"),
      "@/pages/home": path.resolve(__dirname, "client", "src", "pages", "home.gh-pages.tsx"),
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
    base: '/PinkyToeWebsite/',
});