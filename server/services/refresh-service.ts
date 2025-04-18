import { storage } from "../storage";
import { CacheService } from "./cache-service";
import { ImageService } from "./image-service";
import { Article, Team } from "@shared/schema";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Define refresh intervals (in milliseconds)
const REFRESH_INTERVALS = {
  ARTICLES: 120 * 60 * 1000,         // 120 minutes (2 hours)
  FEATURED_ARTICLES: 90 * 60 * 1000,  // 90 minutes (1.5 hours)
  RECENT_ARTICLES: 60 * 60 * 1000,    // 60 minutes (1 hour)
  TEAM: 180 * 60 * 1000,              // 180 minutes (3 hours)
  QUOTES: 180 * 60 * 1000             // 180 minutes (3 hours)
};

// Track timers for cleanup
let refreshTimers: NodeJS.Timeout[] = [];

/**
 * Refresh service handles background data refresh
 * It periodically fetches fresh data from Airtable and updates the cache
 */
export class RefreshService {
  // Track when the last refresh was triggered to prevent too many refreshes in a short period
  private static lastRefreshTime: Record<string, number> = {
    articles: 0,
    featuredArticles: 0,
    recentArticles: 0,
    team: 0,
    quotes: 0,
    all: 0
  };

  // Minimum time between refreshes (in milliseconds) to prevent overloading Airtable API
  private static readonly MIN_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
  
  /**
   * Start all refresh schedules
   */
  static startRefreshSchedules(): void {
    console.log('Starting background data refresh schedules...');
    
    // Initial refresh of all data
    this.refreshAll();
    
    // Schedule periodic refreshes
    const articlesTimer = setInterval(() => this.refreshArticles(), REFRESH_INTERVALS.ARTICLES);
    const featuredArticlesTimer = setInterval(() => this.refreshFeaturedArticles(), REFRESH_INTERVALS.FEATURED_ARTICLES);
    const recentArticlesTimer = setInterval(() => this.refreshRecentArticles(), REFRESH_INTERVALS.RECENT_ARTICLES);
    const teamTimer = setInterval(() => this.refreshTeam(), REFRESH_INTERVALS.TEAM);
    const quotesTimer = setInterval(() => this.refreshQuotes(), REFRESH_INTERVALS.QUOTES);
    
    // Store timers for cleanup
    refreshTimers = [articlesTimer, featuredArticlesTimer, recentArticlesTimer, teamTimer, quotesTimer];
    
    console.log('Background refresh schedules started successfully');
  }
  
  /**
   * Trigger refresh on page visit
   * This is called when a user visits the website
   * It's throttled to prevent too many refreshes in a short period
   */
  static triggerRefreshOnVisit(): void {
    const now = Date.now();
    
    // Check if enough time has passed since the last refresh
    if (now - this.lastRefreshTime.all < this.MIN_REFRESH_INTERVAL) {
      // Too soon since last refresh, skip
      return;
    }
    
    // Update refresh timestamp
    this.lastRefreshTime.all = now;
    
    // Trigger refresh in background
    this.refreshOnDemand().catch(error => {
      console.error('Error in background refresh:', error);
    });
  }
  
  /**
   * Refresh data on demand in background
   * This does not block the response
   * Only refreshes the most critical data (recent articles) to minimize API calls
   */
  static async refreshOnDemand(): Promise<void> {
    console.log('Starting on-demand background refresh (limited)...');
    
    // Just refresh recent articles (most important for user experience)
    // Skip other refreshes to reduce API load
    await this.refreshRecentArticles();
    
    console.log('On-demand background refresh completed');
  }
  
  /**
   * Stop all refresh schedules
   */
  static stopRefreshSchedules(): void {
    console.log('Stopping background data refresh schedules...');
    refreshTimers.forEach(timer => clearInterval(timer));
    refreshTimers = [];
    console.log('Background refresh schedules stopped');
  }
  
  /**
   * Pre-cache an image URL to ensure it's available even if Airtable URL expires
   */
  static async preCacheImage(url: string): Promise<void> {
    if (!url || typeof url !== 'string') return;
    
    // Skip URLs that aren't http/https
    if (!url.startsWith('http')) return;
    
    try {
      // Handle postimg.cc gallery URLs
      if (url.includes('postimg.cc') && !url.includes('i.postimg.cc')) {
        // We handle these directly in the calling methods now
        // This is just a defensive check
        return;
      }
      
      // Handle URLs that are already proxied through our API
      if (url.includes('/api/images/')) {
        // This is already a proxied URL, extract the actual URL
        try {
          const encodedUrl = url.split('/api/images/')[1];
          const decodedUrl = decodeURIComponent(encodedUrl);
          // Replace the proxied URL with the actual URL
          return this.preCacheImage(decodedUrl);
        } catch (error) {
          console.error(`Error extracting URL from proxied URL ${url}:`, error);
        }
      }
      
      // Generate a filename based on URL
      const fileHash = crypto.createHash('md5').update(url).digest('hex');
      
      // Look for cached version first - if it exists, don't re-download
      const cachedFiles = fs.readdirSync(UPLOADS_DIR).filter(f => f.startsWith(fileHash));
      if (cachedFiles.length > 0) {
        // We already have this image cached
        return;
      }
      
      // Fetch the image
      console.log(`Pre-caching image: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Failed to fetch image: ${url} (Status: ${response.status})`);
        return;
      }
      
      // Get content type and determine extension
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      // Skip if not an image
      if (!contentType.startsWith('image/')) {
        console.error(`URL doesn't point to an image: ${url} (Content-Type: ${contentType})`);
        return;
      }
      
      const ext = contentType.includes('png') ? '.png' : 
                contentType.includes('gif') ? '.gif' : 
                contentType.includes('webp') ? '.webp' : '.jpg';
      
      // Save the image
      const buffer = await response.buffer();
      const filepath = path.join(UPLOADS_DIR, `${fileHash}${ext}`);
      fs.writeFileSync(filepath, buffer);
      
      console.log(`Successfully pre-cached image: ${url}`);
    } catch (error) {
      console.error(`Error pre-caching image ${url}:`, error);
      // Don't throw - we want to continue even if some images fail
    }
  }
  
  /**
   * Pre-cache all image URLs from articles
   * Optimized to minimize Imgur API requests and respect rate limits
   */
  static async preCacheArticleImages(articles: Article[]): Promise<void> {
    if (!articles || !articles.length) return;
    
    const imgurUrls = new Set<string>();
    const postImgUrls = new Set<string>();
    const otherUrls = new Set<string>();
    
    // First pass: collect all URLs and deduplicate them
    for (const article of articles) {
      // Prioritize the primary imageUrl
      if (article.imageUrl) {
        if (article.imageUrl.includes('imgur.com')) {
          imgurUrls.add(article.imageUrl);
        } else if (article.imageUrl.includes('postimg.cc')) {
          postImgUrls.add(article.imageUrl);
        } else {
          otherUrls.add(article.imageUrl);
        }
      }
      
      // Only use imagePath as fallback if imageUrl doesn't exist
      if (!article.imageUrl && article.imagePath && article.imagePath !== null) {
        if (article.imagePath.includes('imgur.com')) {
          imgurUrls.add(article.imagePath);
        } else if (article.imagePath.includes('postimg.cc')) {
          postImgUrls.add(article.imagePath);
        } else {
          otherUrls.add(article.imagePath);
        }
      }
      
      // Skip the Airtable attachment structure since we're now using MainImageLink
    }
    
    console.log(`Found ${imgurUrls.size} unique Imgur URLs, ${postImgUrls.size} PostImg URLs, and ${otherUrls.size} other image URLs`);
    
    // Process general URLs first (typically less rate-limited)
    const otherPromises: Promise<void>[] = [];
    Array.from(otherUrls).forEach(url => {
      otherPromises.push(this.preCacheImage(url));
    });
    
    // Process other URLs with higher concurrency
    const otherBatchSize = 5;
    for (let i = 0; i < otherPromises.length; i += otherBatchSize) {
      const batch = otherPromises.slice(i, i + otherBatchSize);
      await Promise.all(batch);
    }
    
    // Process PostImg URLs one at a time to handle async conversion properly
    for (const url of Array.from(postImgUrls)) {
      try {
        // Convert postimg.cc gallery URLs to direct image URLs if needed
        if (url.includes('postimg.cc') && !url.includes('i.postimg.cc')) {
          const directUrl = await this.convertPostImgToDirectUrl(url);
          await this.preCacheImage(directUrl);
        } else {
          await this.preCacheImage(url);
        }
        
        // Add a small delay between requests to avoid overwhelming the service
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error processing postimg URL ${url}:`, error);
      }
    }
    
    // Process Imgur URLs with much lower concurrency to respect rate limits
    const imgurPromises: Promise<void>[] = [];
    Array.from(imgurUrls).forEach(url => {
      imgurPromises.push(this.preCacheImage(url));
    });
    
    // Very small batch size for Imgur to avoid rate limiting
    const imgurBatchSize = 2;
    for (let i = 0; i < imgurPromises.length; i += imgurBatchSize) {
      const batch = imgurPromises.slice(i, i + imgurBatchSize);
      await Promise.all(batch);
      
      // Add a 3 second delay between batches to avoid overwhelming Imgur
      if (i + imgurBatchSize < imgurPromises.length) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log(`Pre-cached ${imgurUrls.size + postImgUrls.size + otherUrls.size} unique images from articles`);
  }
  
  /**
   * Convert a PostImg.cc URL to its direct image URL format by fetching and parsing the HTML page
   * PostImg URLs follow this pattern:
   * Gallery URL: https://postimg.cc/kRCbhLW1
   * The actual full-size image URL is embedded in the HTML page
   */
  private static async convertPostImgToDirectUrl(url: string): Promise<string> {
    // Check if it's already a direct URL
    if (url.includes('i.postimg.cc')) {
      return url;
    }
    
    // Handle URLs that are already proxied through our API
    if (url.includes('/api/images/')) {
      // Extract the actual URL from the proxied URL
      try {
        const encodedUrl = url.split('/api/images/')[1];
        const decodedUrl = decodeURIComponent(encodedUrl);
        return this.convertPostImgToDirectUrl(decodedUrl);
      } catch (error) {
        console.error(`Error extracting URL from proxied URL ${url}:`, error);
        return url;
      }
    }
    
    try {
      // We need to fetch the HTML page to get the actual full-size image URL
      console.log(`Fetching postimg.cc page to extract full-size image URL: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch postimg.cc page: ${url} (Status: ${response.status})`);
        return url;
      }
      
      const html = await response.text();
      
      // Extract the full-size image URL from the HTML
      const mainImageMatch = html.match(/<img id="main-image" src="([^"]+)"/);
      if (mainImageMatch && mainImageMatch[1]) {
        const fullSizeUrl = mainImageMatch[1].startsWith('//') 
          ? `https:${mainImageMatch[1]}` 
          : mainImageMatch[1];
        
        console.log(`Found full-size image URL: ${fullSizeUrl}`);
        return fullSizeUrl;
      }
      
      // Fallback to the old method if we couldn't parse the HTML
      let imageId = url;
      if (url.includes('postimg.cc/')) {
        imageId = url.split('postimg.cc/')[1].split('/')[0].split('?')[0];
      }
      
      // Use the fallback URL format
      const fallbackUrl = `https://i.postimg.cc/${imageId}/image.jpg`;
      console.log(`Falling back to default URL format: ${fallbackUrl}`);
      return fallbackUrl;
    } catch (error) {
      console.error('Error converting PostImg URL:', error);
      return url; // Return original URL if conversion fails
    }
  }
  
  /**
   * Pre-cache all image URLs from team members
   * Optimized to minimize Imgur API requests and respect rate limits
   */
  static async preCacheTeamImages(teamMembers: Team[]): Promise<void> {
    if (!teamMembers || !teamMembers.length) return;
    
    const imgurUrls = new Set<string>();
    const postImgUrls = new Set<string>();
    const otherUrls = new Set<string>();
    
    // First pass: collect all URLs and deduplicate them
    for (const member of teamMembers) {
      // Prioritize the primary imageUrl
      if (member.imageUrl) {
        if (member.imageUrl.includes('imgur.com')) {
          imgurUrls.add(member.imageUrl);
        } else if (member.imageUrl.includes('postimg.cc')) {
          postImgUrls.add(member.imageUrl);
        } else {
          otherUrls.add(member.imageUrl);
        }
      }
      
      // Only use imagePath as fallback if imageUrl doesn't exist
      if (!member.imageUrl && member.imagePath && member.imagePath !== null) {
        if (member.imagePath.includes('imgur.com')) {
          imgurUrls.add(member.imagePath);
        } else if (member.imagePath.includes('postimg.cc')) {
          postImgUrls.add(member.imagePath);
        } else {
          otherUrls.add(member.imagePath);
        }
      }
      
      // Skip the Airtable attachment structure since we're now using MainImageLink
    }
    
    console.log(`Found ${imgurUrls.size} unique Imgur URLs, ${postImgUrls.size} PostImg URLs, and ${otherUrls.size} other image URLs for team members`);
    
    // Process non-Imgur/PostImg URLs first (typically less rate-limited)
    const otherPromises: Promise<void>[] = [];
    Array.from(otherUrls).forEach(url => {
      otherPromises.push(this.preCacheImage(url));
    });
    
    // Process other URLs with higher concurrency
    const otherBatchSize = 5;
    for (let i = 0; i < otherPromises.length; i += otherBatchSize) {
      const batch = otherPromises.slice(i, i + otherBatchSize);
      await Promise.all(batch);
    }
    
    // Process PostImg URLs one at a time to handle async conversion properly
    for (const url of Array.from(postImgUrls)) {
      try {
        // Convert postimg.cc gallery URLs to direct image URLs if needed
        if (url.includes('postimg.cc') && !url.includes('i.postimg.cc')) {
          const directUrl = await this.convertPostImgToDirectUrl(url);
          await this.preCacheImage(directUrl);
        } else {
          await this.preCacheImage(url);
        }
        
        // Add a small delay between requests to avoid overwhelming the service
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error processing postimg URL ${url}:`, error);
      }
    }
    
    // Process Imgur URLs with much lower concurrency to respect rate limits
    const imgurPromises: Promise<void>[] = [];
    Array.from(imgurUrls).forEach(url => {
      imgurPromises.push(this.preCacheImage(url));
    });
    
    // Very small batch size for Imgur to avoid rate limiting
    const imgurBatchSize = 2;
    for (let i = 0; i < imgurPromises.length; i += imgurBatchSize) {
      const batch = imgurPromises.slice(i, i + imgurBatchSize);
      await Promise.all(batch);
      
      // Add a 3 second delay between batches to avoid overwhelming Imgur
      if (i + imgurBatchSize < imgurPromises.length) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log(`Pre-cached ${otherUrls.size + postImgUrls.size + imgurUrls.size} unique images from team members`);
  }

  /**
   * Refresh all data at once
   */
  static async refreshAll(): Promise<void> {
    console.log('Performing full data refresh...');
    
    // Reset all timestamps to ensure refreshes run
    const now = Date.now();
    this.lastRefreshTime = {
      articles: 0,
      featuredArticles: 0,
      recentArticles: 0,
      team: 0,
      quotes: 0,
      all: now
    };
    
    // Use the same approach as on-demand refresh but with forced refresh
    await this.refreshRecentArticles();
    await this.refreshFeaturedArticles();
    await this.refreshArticles();
    await this.refreshTeam();
    await this.refreshQuotes();
    
    console.log('Full data refresh completed');
  }
  
  /**
   * Refresh articles
   */
  static async refreshArticles(): Promise<void> {
    try {
      // Check if it's too soon to refresh again
      const now = Date.now();
      if (now - this.lastRefreshTime.articles < this.MIN_REFRESH_INTERVAL) {
        console.log('Skipping articles refresh (too soon since last refresh)');
        return;
      }
      
      console.log('Refreshing articles data...');
      this.lastRefreshTime.articles = now;
      
      const result = await storage.getArticles(1, 100); // Get a large batch
      CacheService.cacheArticles(result);
      
      // Pre-cache images from articles to handle Airtable's expiring URLs
      await this.preCacheArticleImages(result.articles);
      
      console.log(`Articles refresh completed (${result.articles.length} articles)`);
    } catch (error) {
      console.error('Error refreshing articles:', error);
    }
  }
  
  /**
   * Refresh featured articles
   */
  static async refreshFeaturedArticles(): Promise<void> {
    try {
      // Check if it's too soon to refresh again
      const now = Date.now();
      if (now - this.lastRefreshTime.featuredArticles < this.MIN_REFRESH_INTERVAL) {
        console.log('Skipping featured articles refresh (too soon since last refresh)');
        return;
      }
      
      console.log('Refreshing featured articles data...');
      this.lastRefreshTime.featuredArticles = now;
      
      const articles = await storage.getFeaturedArticles();
      CacheService.cacheFeaturedArticles(articles);
      
      // Pre-cache images from featured articles to handle Airtable's expiring URLs
      await this.preCacheArticleImages(articles);
      
      console.log(`Featured articles refresh completed (${articles.length} articles)`);
    } catch (error) {
      console.error('Error refreshing featured articles:', error);
    }
  }
  
  /**
   * Refresh recent articles
   */
  static async refreshRecentArticles(): Promise<void> {
    try {
      // Check if it's too soon to refresh again
      const now = Date.now();
      if (now - this.lastRefreshTime.recentArticles < this.MIN_REFRESH_INTERVAL) {
        console.log('Skipping recent articles refresh (too soon since last refresh)');
        return;
      }
      
      console.log('Refreshing recent articles data...');
      this.lastRefreshTime.recentArticles = now;
      
      const articles = await storage.getRecentArticles(8); // Get more than default for cache
      CacheService.cacheRecentArticles(articles);
      
      // Pre-cache images from recent articles to handle Airtable's expiring URLs
      await this.preCacheArticleImages(articles);
      
      console.log(`Recent articles refresh completed (${articles.length} articles)`);
    } catch (error) {
      console.error('Error refreshing recent articles:', error);
    }
  }
  
  /**
   * Refresh team members
   */
  static async refreshTeam(): Promise<void> {
    try {
      // Check if it's too soon to refresh again
      const now = Date.now();
      if (now - this.lastRefreshTime.team < this.MIN_REFRESH_INTERVAL) {
        console.log('Skipping team members refresh (too soon since last refresh)');
        return;
      }
      
      console.log('Refreshing team members data...');
      this.lastRefreshTime.team = now;
      
      const team = await storage.getTeamMembers();
      CacheService.cacheTeamMembers(team);
      
      // Pre-cache images from team members to handle Airtable's expiring URLs
      await this.preCacheTeamImages(team);
      
      console.log(`Team members refresh completed (${team.length} members)`);
    } catch (error) {
      console.error('Error refreshing team members:', error);
    }
  }
  
  /**
   * Refresh quotes
   */
  static async refreshQuotes(): Promise<void> {
    try {
      // Check if it's too soon to refresh again
      const now = Date.now();
      if (now - this.lastRefreshTime.quotes < this.MIN_REFRESH_INTERVAL) {
        console.log('Skipping quotes refresh (too soon since last refresh)');
        return;
      }
      
      console.log('Refreshing quotes data...');
      this.lastRefreshTime.quotes = now;
      
      const quotes = await storage.getQuotes();
      CacheService.cacheQuotes(quotes);
      console.log(`Quotes refresh completed (${quotes.length} quotes)`);
    } catch (error) {
      console.error('Error refreshing quotes:', error);
    }
  }
}