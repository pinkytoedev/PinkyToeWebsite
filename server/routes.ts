import type { Express } from "express";
import { createServer, type Server } from "http";
import { cachedStorage } from "./index";
import { imagesRouter } from "./routes/images";
import { adminRouter } from "./routes/admin";
import { webhooksRouter } from "./routes/webhooks";
import {
  RefreshService,
  REFRESHABLE_ENTITIES,
  isRefreshableEntity,
} from "./services/refresh-service";
import { CacheService } from "./services/cache-service";
import { PublicationScheduler } from "./services/publication-scheduler";
import { requireAdmin } from "./middleware/auth";
import { z } from "zod";

/** Query contract for GET /api/articles. */
const articleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(6),
  search: z.string().max(100).default(""),
});

/** Query contract for GET /api/articles/recent. */
const recentArticlesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(4),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Register the routers
  app.use('/api/images', imagesRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/webhooks', webhooksRouter);

  // Legacy alias for POST /api/admin/refresh[/:entity]. Kept because it is
  // documented in PUBLICATION_CACHING.md and used by the console helpers;
  // shares the admin gate and the same refresh logic.
  app.post("/api/cache/refresh", requireAdmin, async (req, res) => {
    try {
      const { entity } = req.body ?? {};

      if (entity) {
        if (!isRefreshableEntity(entity)) {
          return res.status(400).json({
            success: false,
            message: `Invalid entity type. Valid options are: ${REFRESHABLE_ENTITIES.join(', ')}`
          });
        }

        await RefreshService.invalidateAndRefresh(entity);

        return res.json({
          success: true,
          message: `${entity} cache has been invalidated and refreshed`
        });
      }

      CacheService.invalidateAllCaches();
      await RefreshService.refreshAll();

      res.json({
        success: true,
        message: 'All caches have been invalidated and data refreshed'
      });
    } catch (error) {
      console.error("Cache refresh failed:", error);
      res.status(500).json({
        success: false,
        message: "Cache refresh failed",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/cache/status", async (req, res) => {
    try {
      const isBusinessHours = PublicationScheduler.isBusinessHours();
      const criticalInterval = PublicationScheduler.getRefreshInterval('critical');
      const importantInterval = PublicationScheduler.getRefreshInterval('important');
      const stableInterval = PublicationScheduler.getRefreshInterval('stable');

      res.json({
        isBusinessHours,
        refreshIntervals: {
          critical: {
            minutes: Math.round(criticalInterval / (60 * 1000)),
            milliseconds: criticalInterval
          },
          important: {
            minutes: Math.round(importantInterval / (60 * 1000)),
            milliseconds: importantInterval
          },
          stable: {
            minutes: Math.round(stableInterval / (60 * 1000)),
            milliseconds: stableInterval
          }
        },
        cacheExpiry: {
          critical: {
            minutes: Math.round(PublicationScheduler.getCacheExpiry('critical') / (60 * 1000)),
            milliseconds: PublicationScheduler.getCacheExpiry('critical')
          },
          important: {
            minutes: Math.round(PublicationScheduler.getCacheExpiry('important') / (60 * 1000)),
            milliseconds: PublicationScheduler.getCacheExpiry('important')
          },
          stable: {
            minutes: Math.round(PublicationScheduler.getCacheExpiry('stable') / (60 * 1000)),
            milliseconds: PublicationScheduler.getCacheExpiry('stable')
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error getting cache status:", error);
      res.status(500).json({ message: "Failed to get cache status" });
    }
  });
  // API routes for articles
  app.get("/api/articles", async (req, res) => {
    try {
      // Validate rather than parseInt-and-hope: an unbounded `limit` makes every
      // request pull the whole History table, and a negative one silently
      // truncates via slice().
      const parsed = articleQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid query parameters",
          issues: parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
        });
      }

      const { page, limit, search } = parsed.data;
      const result = await cachedStorage.getArticles(page, limit, search);
      res.json(result);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get("/api/articles/featured", async (_req, res) => {
    try {
      const featuredArticles = await cachedStorage.getFeaturedArticles();
      res.json(featuredArticles);
    } catch (error) {
      console.error("Error fetching featured articles:", error);
      res.status(500).json({ message: "Failed to fetch featured articles" });
    }
  });

  app.get("/api/articles/recent", async (req, res) => {
    try {
      const parsed = recentArticlesQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid query parameters" });
      }

      const recentArticles = await cachedStorage.getRecentArticles(parsed.data.limit);
      res.json(recentArticles);
    } catch (error) {
      console.error("Error fetching recent articles:", error);
      res.status(500).json({ message: "Failed to fetch recent articles" });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      const article = await cachedStorage.getArticleById(req.params.id);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      res.json(article);
    } catch (error) {
      console.error(`Error fetching article ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  // API routes for team members
  app.get("/api/team", async (_req, res) => {
    try {
      const teamMembers = await cachedStorage.getTeamMembers();
      res.json(teamMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.get("/api/team/:id", async (req, res) => {
    try {
      const teamMember = await cachedStorage.getTeamMemberById(req.params.id);

      if (!teamMember) {
        return res.status(404).json({ message: "Team member not found" });
      }

      res.json(teamMember);
    } catch (error) {
      console.error(`Error fetching team member ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch team member" });
    }
  });

  app.get("/api/team/:id/articles", async (req, res) => {
    try {
      const articles = await cachedStorage.getArticlesByAuthorId(req.params.id);
      res.json(articles);
    } catch (error) {
      console.error(`Error fetching articles for team member ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch team member articles" });
    }
  });

  // API routes for quotes
  app.get("/api/quotes", async (_req, res) => {
    try {
      const quotes = await cachedStorage.getQuotes();
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  app.get("/api/quotes/daily", async (_req, res) => {
    try {
      const quoteOfDay = await cachedStorage.getQuoteOfDay();
      res.json(quoteOfDay);
    } catch (error) {
      console.error("Error fetching quote of the day:", error);
      res.status(500).json({ message: "Failed to fetch quote of the day" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
