import { storage } from "../storage";
import { CacheService } from "./cache-service";

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