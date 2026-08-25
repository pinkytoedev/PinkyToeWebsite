// Import config first to ensure environment variables are loaded
import "./config";

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { CachedStorage } from "./storage-cached";
import { RefreshService } from "./services/refresh-service";
import { findAvailablePort } from "./utils/port-manager";

// Create cached storage wrapper around the original storage
export const cachedStorage = new CachedStorage(storage);

// How long to wait for in-flight connections to drain before forcing exit.
const SHUTDOWN_TIMEOUT_MS = 10_000;

// A crash here would otherwise take the process down with no diagnostics.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Add middleware to trigger refresh on page visits
app.use((req, res, next) => {
  // Skip API routes and static assets to avoid unnecessary refreshes
  const path = req.path;
  if (!path.startsWith('/api') && !path.includes('.')) {
    // This is a page visit, trigger a background refresh
    // The refresh is throttled internally to prevent overloading Airtable API
    RefreshService.triggerRefreshOnVisit();
  }
  next();
});

// Request logging for API routes.
//
// Deliberately does not capture response bodies: doing so meant JSON.stringify-ing
// every payload (tens of KB per /api/articles response) only to truncate it to
// 79 characters and throw the rest away.
app.use((req, res, next) => {
  if (!req.path.startsWith("/api")) {
    return next();
  }

  const start = Date.now();

  res.on("finish", () => {
    log(`${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`);
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Unhandled request error:', err);

    if (res.headersSent) {
      return;
    }

    // Note: do not re-throw here. Express forwards a throw from an error
    // handler to finalhandler, which sees headersSent and destroys the socket,
    // aborting the response we just serialized.
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Get port from environment variable or use default
  const defaultPort = parseInt(process.env.PORT || '5000', 10);
  const host = process.env.HOST || '0.0.0.0';

  // Registered before listen() so a signal arriving during startup is handled.
  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log('Shutting down refresh service...');
    RefreshService.stopRefreshSchedules();

    // Don't let a lingering keep-alive connection hold the process past the
    // platform's kill window.
    const forceExit = setTimeout(() => {
      console.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    // Find an available port
    const port = await findAvailablePort(defaultPort, 10, host);

    server.listen({
      port,
      host,
    }, () => {
      console.log(`Server is running on http://${host}:${port}`);

      if (app.get('env') === 'development') {
        log(`Client: http://localhost:${port}`);
        log(`API: http://localhost:${port}/api`);
      }

      // Start background refresh service once server is running
      console.log('Starting publication-aware cache system...');
      
      // Warm up cache first for immediate availability
      RefreshService.warmupCache().then(() => {
        console.log('Cache warmup completed, starting refresh schedules...');
        RefreshService.startRefreshSchedules();
      }).catch((error) => {
        console.error('Cache warmup failed, starting refresh schedules anyway:', error);
        RefreshService.startRefreshSchedules();
      });

    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
        process.exit(1);
      } else {
        console.error(`Server error: ${error.message}`);
        throw error;
      }
    });
  } catch (error) {
    console.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
})();
