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
  ARTICLES: 15 * 60 * 1000,       // 15 minutes
  FEATURED_ARTICLES: 15 * 60 * 1000, // 15 minutes
  RECENT_ARTICLES: 15 * 60 * 1000,   // 15 minutes
  TEAM: 30 * 60 * 1000,           // 30 minutes
  QUOTES: 30 * 60 * 1000,         // 30 minutes
};

// Track timers for cleanup
let refreshTimers: NodeJS.Timeout[] = [];

/**
 * Refresh service handles background data refresh
 * It periodically fetches fresh data from Airtable and updates the cache
 */
export class RefreshService {
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
   */
  static async preCacheArticleImages(articles: Article[]): Promise<void> {
    if (!articles || !articles.length) return;
    
    const imagePromises: Promise<void>[] = [];
    
    for (const article of articles) {
      // For articles, check both imageUrl and imagePath
      if (article.imageUrl) {
        imagePromises.push(this.preCacheImage(article.imageUrl));
      }
      
      if (article.imagePath && article.imagePath !== null) {
        imagePromises.push(this.preCacheImage(article.imagePath));
      }
      
      // Some articles might have an Airtable attachment structure
      // This handles cases where Airtable directly returns attachment objects
      const anyArticle = article as any;
      if (anyArticle.attachments && Array.isArray(anyArticle.attachments)) {
        for (const attachment of anyArticle.attachments) {
          if (typeof attachment === 'string') {
            imagePromises.push(this.preCacheImage(attachment));
          } else if (attachment && typeof attachment === 'object') {
            if (attachment.url) {
              imagePromises.push(this.preCacheImage(attachment.url));
            }
            
            // Also cache thumbnails if available
            if (attachment.thumbnails) {
              if (attachment.thumbnails.small && attachment.thumbnails.small.url) {
                imagePromises.push(this.preCacheImage(attachment.thumbnails.small.url));
              }
              if (attachment.thumbnails.large && attachment.thumbnails.large.url) {
                imagePromises.push(this.preCacheImage(attachment.thumbnails.large.url));
              }
              if (attachment.thumbnails.full && attachment.thumbnails.full.url) {
                imagePromises.push(this.preCacheImage(attachment.thumbnails.full.url));
              }
            }
          }
        }
      }
    }
    
    // Run image pre-caching in parallel but limit concurrency
    const batchSize = 5; // Process 5 images at a time
    for (let i = 0; i < imagePromises.length; i += batchSize) {
      const batch = imagePromises.slice(i, i + batchSize);
      await Promise.all(batch);
    }
    
    console.log(`Pre-cached ${imagePromises.length} images from articles`);
  }
  
  /**
   * Pre-cache all image URLs from team members
   */
  static async preCacheTeamImages(teamMembers: Team[]): Promise<void> {
    if (!teamMembers || !teamMembers.length) return;
    
    const imagePromises: Promise<void>[] = [];
    
    for (const member of teamMembers) {
      // Handle imagePath from the schema
      if (member.imagePath && member.imagePath !== null) {
        imagePromises.push(this.preCacheImage(member.imagePath));
      }
      
      // Handle imageUrl from the schema
      if (member.imageUrl) {
        imagePromises.push(this.preCacheImage(member.imageUrl));
      }
      
      // Some team members might have Airtable attachment structures
      // This handles cases where Airtable directly returns attachment objects
      const anyMember = member as any;
      if (anyMember.attachments && Array.isArray(anyMember.attachments)) {
        for (const attachment of anyMember.attachments) {
          if (typeof attachment === 'string') {
            imagePromises.push(this.preCacheImage(attachment));
          } else if (attachment && typeof attachment === 'object') {
            if (attachment.url) {
              imagePromises.push(this.preCacheImage(attachment.url));
            }
            
            // Also cache thumbnails if available
            if (attachment.thumbnails) {
              if (attachment.thumbnails.small && attachment.thumbnails.small.url) {
                imagePromises.push(this.preCacheImage(attachment.thumbnails.small.url));
              }
              if (attachment.thumbnails.large && attachment.thumbnails.large.url) {
                imagePromises.push(this.preCacheImage(attachment.thumbnails.large.url));
              }
              if (attachment.thumbnails.full && attachment.thumbnails.full.url) {
                imagePromises.push(this.preCacheImage(attachment.thumbnails.full.url));
              }
            }
          }
        }
      }
    }
    
    // Run image pre-caching in parallel but limit concurrency
    const batchSize = 5; // Process 5 images at a time
    for (let i = 0; i < imagePromises.length; i += batchSize) {
      const batch = imagePromises.slice(i, i + batchSize);
      await Promise.all(batch);
    }
    
    console.log(`Pre-cached ${imagePromises.length} images from team members`);
  }

  /**
   * Refresh all data at once
   */
  static async refreshAll(): Promise<void> {
    console.log('Performing full data refresh...');
    await Promise.all([
      this.refreshArticles(),
      this.refreshFeaturedArticles(),
      this.refreshRecentArticles(),
      this.refreshTeam(),
      this.refreshQuotes()
    ]);
    console.log('Full data refresh completed');
  }
  
  /**
   * Refresh articles
   */
  static async refreshArticles(): Promise<void> {
    try {
      console.log('Refreshing articles data...');
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
      console.log('Refreshing featured articles data...');
      const articles = await storage.getFeaturedArticles();
      CacheService.cacheFeaturedArticles(articles);
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
      console.log('Refreshing recent articles data...');
      const articles = await storage.getRecentArticles(8); // Get more than default for cache
      CacheService.cacheRecentArticles(articles);
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
      console.log('Refreshing team members data...');
      const team = await storage.getTeamMembers();
      CacheService.cacheTeamMembers(team);
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
      console.log('Refreshing quotes data...');
      const quotes = await storage.getQuotes();
      CacheService.cacheQuotes(quotes);
      console.log(`Quotes refresh completed (${quotes.length} quotes)`);
    } catch (error) {
      console.error('Error refreshing quotes:', error);
    }
  }
}