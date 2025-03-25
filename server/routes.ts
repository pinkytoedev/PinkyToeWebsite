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
  
  // Helper to check API key format
  function hasValidAirtableKeyFormat(key: string | undefined): boolean {
    if (!key) return false;
    
    const cleanKey = key.trim();
    // Support both legacy and new Personal Access Token (PAT) format
    // Legacy format: starts with "key" (e.g., keyAbc123Def456Ghi)
    // New PAT format: starts with "pat" followed by a version identifier (e.g., patC4AbcDef...)
    return /^key[A-Za-z0-9]{14,}$/.test(cleanKey) || 
           /^pat[A-Za-z][A-Za-z0-9]{16,}$/.test(cleanKey);
  }

  // Diagnostic endpoint for checking environment variables in production
  // Only shows existence and length - not the actual values for security
  app.get("/api/system-check", (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDeployment = !!process.env.REPL_DEPLOYMENT_ID;
    
    res.json({
      environment: {
        node_env: process.env.NODE_ENV || 'undefined',
        is_production: isProduction,
        is_deployment: isDeployment,
        replit_info: {
          has_repl_id: !!process.env.REPL_ID,
          has_repl_owner: !!process.env.REPL_OWNER,
          has_deployment_id: !!process.env.REPL_DEPLOYMENT_ID
        }
      },
      airtable_credentials: {
        api_key_exists: !!process.env.AIRTABLE_API_KEY,
        api_key_length: process.env.AIRTABLE_API_KEY ? process.env.AIRTABLE_API_KEY.length : 0,
        base_id_exists: !!process.env.AIRTABLE_BASE_ID,
        base_id_value: process.env.AIRTABLE_BASE_ID || 'NOT SET',
        storage_type: process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID ? 'AirtableStorage' : 'MemStorage'
      },
      timestamp: new Date().toISOString()
    });
  });
  
  // More detailed system check endpoint with key format validation
  app.get("/api/system-check-full", (req, res) => {
    const airtableApiKey = process.env.AIRTABLE_API_KEY || "";
    const airtableBaseId = process.env.AIRTABLE_BASE_ID || "";
    const cleanKey = airtableApiKey.trim();
    const isProduction = process.env.NODE_ENV === 'production';
    const isDeployment = !!process.env.REPL_DEPLOYMENT_ID;
    
    res.json({
      environment: {
        node_env: process.env.NODE_ENV || 'undefined',
        is_production: isProduction,
        is_deployment: isDeployment,
        replit_info: {
          has_repl_id: !!process.env.REPL_ID,
          has_repl_owner: !!process.env.REPL_OWNER,
          has_deployment_id: !!process.env.REPL_DEPLOYMENT_ID
        },
        env_keys: Object.keys(process.env).filter(key => 
          !key.includes('SECRET') && 
          !key.includes('KEY') && 
          !key.includes('TOKEN')
        )
      },
      airtable_credentials: {
        api_key_exists: !!airtableApiKey,
        api_key_length: airtableApiKey.length,
        api_key_clean_length: cleanKey.length,
        api_key_has_whitespace: airtableApiKey !== cleanKey,
        api_key_first_chars: cleanKey.substring(0, 4),
        api_key_format_valid: hasValidAirtableKeyFormat(cleanKey),
        base_id_exists: !!airtableBaseId,
        base_id_value: airtableBaseId,
        storage_type: storage.constructor.name
      },
      timestamp: new Date().toISOString()
    });
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
      console.log("[DEBUG] Starting featured articles fetch...");
      // Log what type of storage we're using
      console.log("[DEBUG] Storage type:", storage.constructor.name);
      
      const startTime = Date.now();
      const featuredArticles = await storage.getFeaturedArticles();
      const duration = Date.now() - startTime;
      
      console.log(`[DEBUG] Featured articles fetch completed in ${duration}ms, found ${featuredArticles.length} articles`);
      
      if (featuredArticles.length === 0) {
        console.log("[DEBUG] Warning: No featured articles found, this might indicate a data access issue");
      }
      
      res.json(featuredArticles);
    } catch (error: unknown) {
      console.error("[ERROR] Detailed error fetching featured articles:", error);
      // More detailed error logging
      if (error instanceof Error) {
        console.error("[ERROR] Name:", error.name);
        console.error("[ERROR] Message:", error.message);
        console.error("[ERROR] Stack:", error.stack);
        
        // Check for network-related errors
        if (error.message.includes('ECONNREFUSED') || 
            error.message.includes('ETIMEDOUT') || 
            error.message.includes('network') ||
            error.message.includes('socket')) {
          console.error("[ERROR] This appears to be a network connectivity issue");
        }
        
        // Check for Airtable rate limiting
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          console.error("[ERROR] This appears to be an Airtable rate limiting issue");
        }
      }
      
      res.status(500).json({ 
        message: "Failed to fetch featured articles", 
        error: process.env.NODE_ENV === 'production' ? 'See server logs for details' : (error instanceof Error ? error.message : String(error))
      });
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
