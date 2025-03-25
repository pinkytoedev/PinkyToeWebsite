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
    // Support various API key formats:
    // 1. Legacy format: starts with "key" (e.g., keyAbc123Def456Ghi)
    // 2. New Personal Access Token (PAT) format: starts with "pat" followed by a version identifier
    // 3. More flexible pattern for PAT format: some PATs might have different formats between environments
    // 4. Accept any sufficiently long string (at least 16 chars) as a fallback for custom API key formats
    
    // Check for legacy format
    if (/^key[A-Za-z0-9]{14,}$/.test(cleanKey)) {
      return true;
    }
    
    // Check for PAT format with version identifier
    if (/^pat[A-Za-z][A-Za-z0-9]{16,}$/.test(cleanKey)) {
      return true;
    }
    
    // More flexible PAT format (any PAT starting with 'pat')
    if (cleanKey.startsWith('pat') && cleanKey.length >= 20) {
      return true;
    }
    
    // Accept any sufficiently long string as a fallback
    // This is a last resort for custom API key formats
    if (cleanKey.length >= 16) {
      console.log('[API Key Validation] Using fallback validation for non-standard API key format');
      return true;
    }
    
    return false;
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
  
  // API Key diagnostic endpoint that directly tests the Airtable connection
  // Can also test a provided key parameter in the query string
  app.get("/api/airtable-diagnostic", async (req, res) => {
    try {
      // Check for a 'key' parameter for direct testing
      const testKey = req.query.key as string | undefined;
      
      // Use the provided test key if available, otherwise use the environment key
      const airtableApiKey = testKey || process.env.AIRTABLE_API_KEY || "";
      const airtableBaseId = process.env.AIRTABLE_BASE_ID || "";
      const cleanKey = airtableApiKey.trim();
      
      // Configure Airtable with the API key
      const airtable = require('airtable');
      airtable.configure({
        apiKey: cleanKey,
        endpointUrl: 'https://api.airtable.com',
        requestTimeout: 30000 // 30 second timeout
      });
      
      // Create a base instance
      const base = airtable.base(airtableBaseId);
      
      // Start building the diagnostic results
      const diagnosticResults = {
        timestamp: new Date().toISOString(),
        using_test_key: !!testKey,
        api_key: {
          exists: !!airtableApiKey,
          length: airtableApiKey.length,
          format: 'unknown',
          validation: {
            legacy: false,
            pat_strict: false,
            pat_flexible: false,
            length_check: false
          }
        },
        base_id: {
          exists: !!airtableBaseId,
          value: airtableBaseId
        },
        connection_test: {
          status: 'pending',
          tables_found: [] as string[],
          tables_detail: [] as any[],
          error: null as any
        }
      };
      
      // Format detection
      if (cleanKey.startsWith('key')) {
        diagnosticResults.api_key.format = 'legacy';
        diagnosticResults.api_key.validation.legacy = true;
      } else if (cleanKey.startsWith('pat')) {
        diagnosticResults.api_key.format = 'personal_access_token';
        diagnosticResults.api_key.validation.pat_flexible = true;
        if (/^pat[A-Za-z][A-Za-z0-9]{16,}$/.test(cleanKey)) {
          diagnosticResults.api_key.validation.pat_strict = true;
        }
      }
      
      diagnosticResults.api_key.validation.length_check = cleanKey.length >= 16;
      
      // Test a list of possible table names
      const potentialTables = ['Teams', 'History', 'CarouselQuote'];
      const tableResults = [];
      
      // Test each table with a minimal query
      for (const tableName of potentialTables) {
        try {
          console.log(`[DIAGNOSTIC] Testing table '${tableName}'...`);
          const query = base(tableName).select({ maxRecords: 1 });
          const records = await query.firstPage();
          
          tableResults.push({
            table: tableName,
            status: 'success',
            records_found: records.length
          });
          
          diagnosticResults.connection_test.tables_found.push(tableName);
        } catch (error: any) {
          tableResults.push({
            table: tableName,
            status: 'error',
            error_code: error.statusCode || 'unknown',
            error_type: error.error || 'unknown',
            error_message: error.message || 'No error message'
          });
        }
      }
      
      diagnosticResults.connection_test.status = tableResults.some(r => r.status === 'success') 
        ? 'success' : 'failed';
      diagnosticResults.connection_test.tables_detail = tableResults;
      
      res.json(diagnosticResults);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to run Airtable diagnostic',
        message: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // More detailed system check endpoint with key format validation
  app.get("/api/system-check-full", (req, res) => {
    const airtableApiKey = process.env.AIRTABLE_API_KEY || "";
    const airtableBaseId = process.env.AIRTABLE_BASE_ID || "";
    const cleanKey = airtableApiKey.trim();
    const isProduction = process.env.NODE_ENV === 'production';
    const isDeployment = !!process.env.REPL_DEPLOYMENT_ID;
    
    // Determine API key format more precisely
    let apiKeyFormat = 'unknown';
    let apiKeyPrefix = 'none';
    let apiKeyPrefixLength = 0;
    let apiKeyValidationResults = {
      legacy: false,
      pat_strict: false,
      pat_flexible: false,
      length_fallback: false
    };
    
    if (airtableApiKey) {
      // Legacy format check
      apiKeyValidationResults.legacy = /^key[A-Za-z0-9]{14,}$/.test(cleanKey);
      
      // PAT strict format check
      apiKeyValidationResults.pat_strict = /^pat[A-Za-z][A-Za-z0-9]{16,}$/.test(cleanKey);
      
      // PAT flexible format check
      apiKeyValidationResults.pat_flexible = cleanKey.startsWith('pat') && cleanKey.length >= 20;
      
      // Length fallback check
      apiKeyValidationResults.length_fallback = cleanKey.length >= 16;
      
      // Get a safe prefix for diagnosis
      if (cleanKey.startsWith('key')) {
        apiKeyFormat = 'legacy';
        apiKeyPrefix = 'key';
        apiKeyPrefixLength = 3;
      } else if (cleanKey.startsWith('pat')) {
        apiKeyFormat = 'personal_access_token';
        const prefixEnd = Math.min(6, cleanKey.length);
        apiKeyPrefix = cleanKey.substring(0, prefixEnd);
        apiKeyPrefixLength = prefixEnd;
      } else {
        // Try to get a safe prefix for diagnosis (first 4 chars)
        const prefixEnd = Math.min(4, cleanKey.length);
        apiKeyPrefix = cleanKey.substring(0, prefixEnd);
        apiKeyPrefixLength = prefixEnd;
        apiKeyFormat = 'custom';
      }
    }
    
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
        api_key_prefix: apiKeyPrefix,
        api_key_format: apiKeyFormat,
        api_key_validation: apiKeyValidationResults,
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
