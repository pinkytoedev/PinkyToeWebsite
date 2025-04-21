import { Article, Team, CarouselQuote } from "@shared/schema";
import fs from 'fs';
import path from 'path';

// Define cache directory paths
const CACHE_DIR = path.join(process.cwd(), 'cache');
const ARTICLES_CACHE_FILE = path.join(CACHE_DIR, 'articles.json');
const FEATURED_ARTICLES_CACHE_FILE = path.join(CACHE_DIR, 'featured-articles.json');
const RECENT_ARTICLES_CACHE_FILE = path.join(CACHE_DIR, 'recent-articles.json'); 
const TEAM_CACHE_FILE = path.join(CACHE_DIR, 'team.json');
const QUOTES_CACHE_FILE = path.join(CACHE_DIR, 'quotes.json');

// Create cache directory if it doesn't exist
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  console.log(`Created cache directory at ${CACHE_DIR}`);
}

// Cache expiration times (in milliseconds)
const CACHE_EXPIRY = {
  ARTICLES: 30 * 60 * 1000, // 30 minutes
  TEAM: 60 * 60 * 1000,     // 1 hour
  QUOTES: 60 * 60 * 1000,   // 1 hour
};

// Cache metadata type
interface CacheData<T> {
  data: T;
  timestamp: number;
}

export class CacheService {
  /**
   * Get cached articles or return null if cache is invalid
   */
  static getCachedArticles(): { articles: Article[], total: number } | null {
    try {
      if (!fs.existsSync(ARTICLES_CACHE_FILE)) {
        return null;
      }

      const cacheContent = fs.readFileSync(ARTICLES_CACHE_FILE, 'utf-8');
      const cache = JSON.parse(cacheContent) as CacheData<{ articles: Article[], total: number }>;
      
      // Check if cache is expired
      if (Date.now() - cache.timestamp > CACHE_EXPIRY.ARTICLES) {
        console.log('Articles cache expired, returning null');
        return null;
      }
      
      // Validate cache integrity
      if (!cache.data || !cache.data.articles || !Array.isArray(cache.data.articles)) {
        console.error('Articles cache structure is invalid, returning null');
        return null;
      }
      
      // Check if total makes sense compared to array length
      if (typeof cache.data.total !== 'number' || cache.data.total < cache.data.articles.length) {
        console.error('Articles cache has inconsistent total count, returning null');
        return null;
      }
      
      // Ensure every article has required fields
      const invalidArticles = cache.data.articles.filter(article => 
        !article || !article.id || !article.title
      );
      
      if (invalidArticles.length > 0) {
        console.error(`Found ${invalidArticles.length} invalid articles in cache, returning null`);
        return null;
      }
      
      return cache.data;
    } catch (error) {
      console.error('Error reading articles cache:', error);
      return null;
    }
  }

  /**
   * Get cached featured articles or return null if cache is invalid
   */
  static getCachedFeaturedArticles(): Article[] | null {
    try {
      if (!fs.existsSync(FEATURED_ARTICLES_CACHE_FILE)) {
        return null;
      }

      const cacheContent = fs.readFileSync(FEATURED_ARTICLES_CACHE_FILE, 'utf-8');
      const cache = JSON.parse(cacheContent) as CacheData<Article[]>;
      
      // Check if cache is expired
      if (Date.now() - cache.timestamp > CACHE_EXPIRY.ARTICLES) {
        console.log('Featured articles cache expired, returning null');
        return null;
      }
      
      // Validate cache integrity
      if (!cache.data || !Array.isArray(cache.data)) {
        console.error('Featured articles cache structure is invalid, returning null');
        return null;
      }
      
      // Ensure every article has required fields
      const invalidArticles = cache.data.filter(article => 
        !article || !article.id || !article.title
      );
      
      if (invalidArticles.length > 0) {
        console.error(`Found ${invalidArticles.length} invalid featured articles in cache, returning null`);
        return null;
      }
      
      return cache.data;
    } catch (error) {
      console.error('Error reading featured articles cache:', error);
      return null;
    }
  }

  /**
   * Get cached recent articles or return null if cache is invalid
   */
  static getCachedRecentArticles(): Article[] | null {
    try {
      if (!fs.existsSync(RECENT_ARTICLES_CACHE_FILE)) {
        return null;
      }

      const cacheContent = fs.readFileSync(RECENT_ARTICLES_CACHE_FILE, 'utf-8');
      const cache = JSON.parse(cacheContent) as CacheData<Article[]>;
      
      // Check if cache is expired
      if (Date.now() - cache.timestamp > CACHE_EXPIRY.ARTICLES) {
        console.log('Recent articles cache expired, returning null');
        return null;
      }
      
      // Validate cache integrity
      if (!cache.data || !Array.isArray(cache.data)) {
        console.error('Recent articles cache structure is invalid, returning null');
        return null;
      }
      
      // Ensure every article has required fields
      const invalidArticles = cache.data.filter(article => 
        !article || !article.id || !article.title
      );
      
      if (invalidArticles.length > 0) {
        console.error(`Found ${invalidArticles.length} invalid recent articles in cache, returning null`);
        return null;
      }
      
      return cache.data;
    } catch (error) {
      console.error('Error reading recent articles cache:', error);
      return null;
    }
  }

  /**
   * Get cached team members or return null if cache is invalid
   */
  static getCachedTeamMembers(): Team[] | null {
    try {
      if (!fs.existsSync(TEAM_CACHE_FILE)) {
        return null;
      }

      const cacheContent = fs.readFileSync(TEAM_CACHE_FILE, 'utf-8');
      const cache = JSON.parse(cacheContent) as CacheData<Team[]>;
      
      // Check if cache is expired
      if (Date.now() - cache.timestamp > CACHE_EXPIRY.TEAM) {
        return null;
      }
      
      return cache.data;
    } catch (error) {
      console.error('Error reading team cache:', error);
      return null;
    }
  }

  /**
   * Get cached quotes or return null if cache is invalid
   */
  static getCachedQuotes(): CarouselQuote[] | null {
    try {
      if (!fs.existsSync(QUOTES_CACHE_FILE)) {
        return null;
      }

      const cacheContent = fs.readFileSync(QUOTES_CACHE_FILE, 'utf-8');
      const cache = JSON.parse(cacheContent) as CacheData<CarouselQuote[]>;
      
      // Check if cache is expired
      if (Date.now() - cache.timestamp > CACHE_EXPIRY.QUOTES) {
        return null;
      }
      
      return cache.data;
    } catch (error) {
      console.error('Error reading quotes cache:', error);
      return null;
    }
  }

  /**
   * Cache articles data
   */
  static cacheArticles(data: { articles: Article[], total: number }): void {
    try {
      const cacheData: CacheData<{ articles: Article[], total: number }> = {
        data,
        timestamp: Date.now()
      };
      
      fs.writeFileSync(ARTICLES_CACHE_FILE, JSON.stringify(cacheData, null, 2));
      console.log('Articles cached successfully');
    } catch (error) {
      console.error('Error caching articles:', error);
    }
  }

  /**
   * Cache featured articles data
   */
  static cacheFeaturedArticles(data: Article[]): void {
    try {
      const cacheData: CacheData<Article[]> = {
        data,
        timestamp: Date.now()
      };
      
      fs.writeFileSync(FEATURED_ARTICLES_CACHE_FILE, JSON.stringify(cacheData, null, 2));
      console.log('Featured articles cached successfully');
    } catch (error) {
      console.error('Error caching featured articles:', error);
    }
  }

  /**
   * Cache recent articles data
   */
  static cacheRecentArticles(data: Article[]): void {
    try {
      const cacheData: CacheData<Article[]> = {
        data,
        timestamp: Date.now()
      };
      
      fs.writeFileSync(RECENT_ARTICLES_CACHE_FILE, JSON.stringify(cacheData, null, 2));
      console.log('Recent articles cached successfully');
    } catch (error) {
      console.error('Error caching recent articles:', error);
    }
  }

  /**
   * Cache team members data
   */
  static cacheTeamMembers(data: Team[]): void {
    try {
      const cacheData: CacheData<Team[]> = {
        data,
        timestamp: Date.now()
      };
      
      fs.writeFileSync(TEAM_CACHE_FILE, JSON.stringify(cacheData, null, 2));
      console.log('Team members cached successfully');
    } catch (error) {
      console.error('Error caching team members:', error);
    }
  }

  /**
   * Cache quotes data
   */
  static cacheQuotes(data: CarouselQuote[]): void {
    try {
      const cacheData: CacheData<CarouselQuote[]> = {
        data,
        timestamp: Date.now()
      };
      
      fs.writeFileSync(QUOTES_CACHE_FILE, JSON.stringify(cacheData, null, 2));
      console.log('Quotes cached successfully');
    } catch (error) {
      console.error('Error caching quotes:', error);
    }
  }

  /**
   * Invalidate a specific cache
   * @param cacheType The type of cache to invalidate ('articles', 'featuredArticles', 'recentArticles', 'team', 'quotes')
   */
  static invalidateCache(cacheType: string): void {
    try {
      let cacheFile: string | null = null;
      
      switch (cacheType) {
        case 'articles':
          cacheFile = ARTICLES_CACHE_FILE;
          break;
        case 'featuredArticles':
          cacheFile = FEATURED_ARTICLES_CACHE_FILE;
          break;
        case 'recentArticles':
          cacheFile = RECENT_ARTICLES_CACHE_FILE;
          break;
        case 'team':
          cacheFile = TEAM_CACHE_FILE;
          break;
        case 'quotes':
          cacheFile = QUOTES_CACHE_FILE;
          break;
        default:
          console.warn(`Unknown cache type: ${cacheType}`);
          return;
      }
      
      if (cacheFile && fs.existsSync(cacheFile)) {
        fs.unlinkSync(cacheFile);
        console.log(`Cache invalidated: ${cacheType}`);
      } else {
        console.log(`Cache file not found for: ${cacheType}`);
      }
    } catch (error) {
      console.error(`Error invalidating cache for ${cacheType}:`, error);
    }
  }
  
  /**
   * Invalidate all caches
   */
  static invalidateAllCaches(): void {
    try {
      if (fs.existsSync(ARTICLES_CACHE_FILE)) {
        fs.unlinkSync(ARTICLES_CACHE_FILE);
      }
      if (fs.existsSync(FEATURED_ARTICLES_CACHE_FILE)) {
        fs.unlinkSync(FEATURED_ARTICLES_CACHE_FILE);
      }
      if (fs.existsSync(RECENT_ARTICLES_CACHE_FILE)) {
        fs.unlinkSync(RECENT_ARTICLES_CACHE_FILE);
      }
      if (fs.existsSync(TEAM_CACHE_FILE)) {
        fs.unlinkSync(TEAM_CACHE_FILE);
      }
      if (fs.existsSync(QUOTES_CACHE_FILE)) {
        fs.unlinkSync(QUOTES_CACHE_FILE);
      }
      console.log('All caches invalidated');
    } catch (error) {
      console.error('Error invalidating caches:', error);
    }
  }
}