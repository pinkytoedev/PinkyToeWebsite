import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { imagesRouter } from "./routes/images";

// Helper function to set cache headers based on route type
function setCacheHeaders(res: Response, type: 'dynamic' | 'static' = 'dynamic') {
  if (type === 'static') {
    // Static content (team members, quotes) - cache for longer
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
    res.setHeader('ETag', `W/"${Date.now().toString(36)}"`); // Weak ETag
  } else {
    // Dynamic content (articles) - shorter cache time
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
    res.setHeader('ETag', `W/"${Date.now().toString(36)}"`); // Weak ETag
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Register the images router
  app.use('/api/images', imagesRouter);
  
  // API routes for articles
  app.get("/api/articles", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 6;
      const search = req.query.search as string || "";
      
      setCacheHeaders(res);
      const result = await storage.getArticles(page, limit, search);
      res.json(result);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get("/api/articles/featured", async (_req, res) => {
    try {
      setCacheHeaders(res);
      const featuredArticles = await storage.getFeaturedArticles();
      res.json(featuredArticles);
    } catch (error) {
      console.error("Error fetching featured articles:", error);
      res.status(500).json({ message: "Failed to fetch featured articles" });
    }
  });

  app.get("/api/articles/recent", async (req, res) => {
    try {
      setCacheHeaders(res);
      const limit = parseInt(req.query.limit as string) || 4;
      const recentArticles = await storage.getRecentArticles(limit);
      res.json(recentArticles);
    } catch (error) {
      console.error("Error fetching recent articles:", error);
      res.status(500).json({ message: "Failed to fetch recent articles" });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      setCacheHeaders(res);
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
  app.get("/api/team", async (_req, res) => {
    try {
      setCacheHeaders(res, 'static'); // Team members change less frequently
      const teamMembers = await storage.getTeamMembers();
      res.json(teamMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.get("/api/team/:id", async (req, res) => {
    try {
      setCacheHeaders(res, 'static'); // Team members change less frequently
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

  app.get("/api/team/:id/articles", async (req, res) => {
    try {
      setCacheHeaders(res);
      const articles = await storage.getArticlesByAuthorId(req.params.id);
      res.json(articles);
    } catch (error) {
      console.error(`Error fetching articles for team member ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch team member articles" });
    }
  });

  // API routes for quotes
  app.get("/api/quotes", async (_req, res) => {
    try {
      setCacheHeaders(res, 'static'); // Quotes change less frequently
      const quotes = await storage.getQuotes();
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  app.get("/api/quotes/daily", async (_req, res) => {
    try {
      setCacheHeaders(res, 'static'); // Daily quote changes once per day
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
