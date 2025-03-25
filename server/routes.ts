import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { imagesRouter } from "./routes/images";
import { cacheMiddleware, logCacheStats } from "./cache";

export async function registerRoutes(app: Express): Promise<Server> {
  // Log cache stats every 5 minutes
  setInterval(() => {
    logCacheStats();
  }, 5 * 60 * 1000);
  
  // Register the images router
  app.use('/api/images', imagesRouter);
  
  // Setup response headers for API routes
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    // Set Cache-Control headers
    res.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    next();
  });
  // API routes for articles
  app.get("/api/articles", cacheMiddleware(300), async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 6;
      const search = req.query.search as string || "";
      
      const result = await storage.getArticles(page, limit, search);
      res.json(result);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get("/api/articles/featured", cacheMiddleware(300), async (_req, res) => {
    try {
      const featuredArticles = await storage.getFeaturedArticles();
      res.json(featuredArticles);
    } catch (error) {
      console.error("Error fetching featured articles:", error);
      res.status(500).json({ message: "Failed to fetch featured articles" });
    }
  });

  app.get("/api/articles/recent", cacheMiddleware(300), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 4;
      const recentArticles = await storage.getRecentArticles(limit);
      res.json(recentArticles);
    } catch (error) {
      console.error("Error fetching recent articles:", error);
      res.status(500).json({ message: "Failed to fetch recent articles" });
    }
  });

  app.get("/api/articles/:id", cacheMiddleware(300), async (req, res) => {
    try {
      const article = await storage.getArticleById(req.params.id);
      
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
  app.get("/api/team", cacheMiddleware(300), async (_req, res) => {
    try {
      const teamMembers = await storage.getTeamMembers();
      res.json(teamMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.get("/api/team/:id", cacheMiddleware(300), async (req, res) => {
    try {
      const teamMember = await storage.getTeamMemberById(req.params.id);
      
      if (!teamMember) {
        return res.status(404).json({ message: "Team member not found" });
      }
      
      res.json(teamMember);
    } catch (error) {
      console.error(`Error fetching team member ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch team member" });
    }
  });

  app.get("/api/team/:id/articles", cacheMiddleware(300), async (req, res) => {
    try {
      const articles = await storage.getArticlesByAuthorId(req.params.id);
      res.json(articles);
    } catch (error) {
      console.error(`Error fetching articles for team member ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch team member articles" });
    }
  });

  // API routes for quotes
  app.get("/api/quotes", cacheMiddleware(300), async (_req, res) => {
    try {
      const quotes = await storage.getQuotes();
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  app.get("/api/quotes/daily", cacheMiddleware(300), async (_req, res) => {
    try {
      const quoteOfDay = await storage.getQuoteOfDay();
      res.json(quoteOfDay);
    } catch (error) {
      console.error("Error fetching quote of the day:", error);
      res.status(500).json({ message: "Failed to fetch quote of the day" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
