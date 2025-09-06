import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

/**
 * Logs a timestamped, single-line message to the console with an optional source tag.
 *
 * The timestamp is formatted in en-US 12-hour time with minutes and seconds (e.g. "3:05:09 PM").
 *
 * @param message - The text to log.
 * @param source - Optional source tag included in square brackets; defaults to `"express"`.
 */
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Configures Vite in middleware mode and mounts its middleware and an SPA fallback onto the given Express app.
 *
 * This starts a Vite dev server (middlewareMode) wired to the provided HTTP server for HMR, attaches Vite's
 * middlewares to `app`, and registers a catch-all route that:
 * - reads `client/index.html` from disk on every request,
 * - injects a cache-busting query (`?v=<nanoid>`) into the hardcoded `src="/src/main.tsx"` script tag,
 * - runs Vite's HTML transforms via `vite.transformIndexHtml`, and
 * - responds with the transformed HTML.
 *
 * On errors while reading or transforming the page the function calls `vite.ssrFixStacktrace` and forwards the
 * error to Express's `next()`. Note: the custom Vite logger is configured to call `process.exit(1)` on errors.
 */
export async function setupVite(app: Express, server: Server) {
  const serverOptions: any = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
