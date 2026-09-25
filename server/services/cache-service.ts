import { Article, Team, CarouselQuote } from "@shared/schema";
import { PublicationScheduler } from "./publication-scheduler";
import fs from 'fs';
import path from 'path';

// Define cache directory paths
const CACHE_DIR = path.join(process.cwd(), 'cache');
const ARTICLES_CACHE_FILE = path.join(CACHE_DIR, 'articles.json');
const FEATURED_ARTICLES_CACHE_FILE = path.join(CACHE_DIR, 'featured-articles.json');
const RECENT_ARTICLES_CACHE_FILE = path.join(CACHE_DIR, 'recent-articles.json');
const TEAM_CACHE_FILE = path.join(CACHE_DIR, 'team.json');
const QUOTES_CACHE_FILE = path.join(CACHE_DIR, 'quotes.json');
const LOCK_DIR = path.join(CACHE_DIR, 'locks');

// Create cache directory if it doesn't exist
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Create locks directory
if (!fs.existsSync(LOCK_DIR)) {
  fs.mkdirSync(LOCK_DIR, { recursive: true });
}

/**
 * Get publication-aware cache expiry times
 * Using PublicationScheduler to align with refresh intervals
 */
const getCacheExpiry = (contentType: 'articles' | 'team' | 'quotes') => {
  switch (contentType) {
    case 'articles':
      // Articles are critical/important content 
      return PublicationScheduler.getCacheExpiry('important');
    case 'team':
      // Team is stable content
      return PublicationScheduler.getCacheExpiry('stable');
    case 'quotes':
      // Quotes are stable content  
      return PublicationScheduler.getCacheExpiry('stable');
    default:
      // Default to stable content tier
      return PublicationScheduler.getCacheExpiry('stable');
  }
};

// Lock timeout (in milliseconds)
const LOCK_TIMEOUT = 30 * 1000; // 30 seconds

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

      // Check if cache is expired using publication-aware expiry times
      if (Date.now() - cache.timestamp > getCacheExpiry('articles')) {
        return null;
      }

      // Validate cache integrity
      if (!cache.data || !cache.data.articles || !Array.isArray(cache.data.articles)) {
        return null;
      }

      // Check if total makes sense compared to array length
      if (typeof cache.data.total !== 'number' || cache.data.total < cache.data.articles.length) {
        return null;
      }

      // Ensure every article has required fields
      const invalidArticles = cache.data.articles.filter(article =>
        !article || !article.id || !article.title
      );

      if (invalidArticles.length > 0) {
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

      // Check if cache is expired using publication-aware expiry times
      if (Date.now() - cache.timestamp > getCacheExpiry('articles')) {
        // console.log('Featured articles cache expired, returning null');
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

      // Check if cache is expired using publication-aware expiry times
      if (Date.now() - cache.timestamp > getCacheExpiry('articles')) {
        // console.log('Recent articles cache expired, returning null');
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

      // Check if cache is expired using publication-aware expiry times
      if (Date.now() - cache.timestamp > getCacheExpiry('team')) {
        // console.log('Team members cache expired, returning null');
        return null;
      }

      // Validate cache integrity
      if (!cache.data || !Array.isArray(cache.data)) {
        console.error('Team members cache structure is invalid, returning null');
        return null;
      }

      // Ensure every team member has required fields
      const invalidTeamMembers = cache.data.filter(member =>
        !member || !member.id || !member.name
      );

      if (invalidTeamMembers.length > 0) {
        console.error(`Found ${invalidTeamMembers.length} invalid team members in cache, returning null`);
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

      // Check if cache is expired using publication-aware expiry times
      if (Date.now() - cache.timestamp > getCacheExpiry('quotes')) {
        // console.log('Quotes cache expired, returning null');
        return null;
      }

      // Validate cache integrity
      if (!cache.data || !Array.isArray(cache.data)) {
        console.error('Quotes cache structure is invalid, returning null');
        return null;
      }

      // Ensure every quote has required fields
      const invalidQuotes = cache.data.filter(quote =>
        !quote || !quote.id || !quote.quote || !quote.carousel
      );

      if (invalidQuotes.length > 0) {
        console.error(`Found ${invalidQuotes.length} invalid quotes in cache, returning null`);
        return null;
      }

      return cache.data;
    } catch (error) {
      console.error('Error reading quotes cache:', error);
      return null;
    }
  }

  /**
   * Create a lock file for synchronized access
   * @param cacheType The type of cache to lock
   * @returns True if lock was acquired, false otherwise
   */
  private static acquireLock(cacheType: string): boolean {
    try {
      const lockFile = path.join(LOCK_DIR, `${cacheType}.lock`);

      // Check if lock exists and is not stale
      if (fs.existsSync(lockFile)) {
        const lockStats = fs.statSync(lockFile);
        const lockAge = Date.now() - lockStats.mtimeMs;

        if (lockAge < LOCK_TIMEOUT) {
          // Lock is still valid, cannot acquire
          // console.log(`Lock for ${cacheType} is held by another process (${Math.round(lockAge / 1000)}s old)`);
          return false;
        } else {
          // Lock is stale, we can break it
          // console.log(`Breaking stale lock for ${cacheType} (${Math.round(lockAge / 1000)}s old)`);
        }
      }

      // Create lock file
      fs.writeFileSync(lockFile, Date.now().toString());
      return true;
    } catch (error) {
      console.error(`Error acquiring lock for ${cacheType}:`, error);
      return false;
    }
  }

  /**
   * Release a previously acquired lock
   * @param cacheType The type of cache to unlock
   */
  private static releaseLock(cacheType: string): void {
    try {
      const lockFile = path.join(LOCK_DIR, `${cacheType}.lock`);

      if (fs.existsSync(lockFile)) {
        fs.unlinkSync(lockFile);
      }
    } catch (error) {
      console.error(`Error releasing lock for ${cacheType}:`, error);
    }
  }

  /**
   * Cache articles data with locking mechanism to prevent concurrent writes
   */
  static cacheArticles(data: { articles: Article[], total: number }): void {
    const cacheType = 'articles';

    // Try to acquire lock
    if (!this.acquireLock(cacheType)) {
      return;
    }

    try {
      // Validate data first
      if (!data || !data.articles || !Array.isArray(data.articles) || typeof data.total !== 'number') {
        return;
      }

      const cacheData: CacheData<{ articles: Article[], total: number }> = {
        data,
        timestamp: Date.now()
      };

      // Use a temporary file first to avoid corruption during write
      const tempFile = `${ARTICLES_CACHE_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(cacheData, null, 2));

      // Then rename to actual cache file (atomic operation)
      fs.renameSync(tempFile, ARTICLES_CACHE_FILE);
    } catch (error) {
      console.error('Error caching articles:', error);
    } finally {
      // Always release lock
      this.releaseLock(cacheType);
    }
  }

  /**
   * Cache featured articles data with locking mechanism
   */
  static cacheFeaturedArticles(data: Article[]): void {
    const cacheType = 'featuredArticles';

    // Try to acquire lock
    if (!this.acquireLock(cacheType)) {
      console.warn(`Cannot cache featured articles: lock acquisition failed`);
      return;
    }

    try {
      // Validate data first
      if (!data || !Array.isArray(data)) {
        console.error('Invalid featured articles data structure, not caching');
        return;
      }

      const cacheData: CacheData<Article[]> = {
        data,
        timestamp: Date.now()
      };

      // Use a temporary file first
      const tempFile = `${FEATURED_ARTICLES_CACHE_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(cacheData, null, 2));

      // Rename to actual cache file (atomic operation)
      fs.renameSync(tempFile, FEATURED_ARTICLES_CACHE_FILE);

      // console.log('Featured articles cached successfully');
    } catch (error) {
      console.error('Error caching featured articles:', error);
    } finally {
      // Always release lock
      this.releaseLock(cacheType);
    }
  }

  /**
   * Cache recent articles data with locking mechanism
   */
  static cacheRecentArticles(data: Article[]): void {
    const cacheType = 'recentArticles';

    // Try to acquire lock
    if (!this.acquireLock(cacheType)) {
      // console.warn(`Cannot cache recent articles: lock acquisition failed`);
      return;
    }

    try {
      // Validate data first
      if (!data || !Array.isArray(data)) {
        console.error('Invalid recent articles data structure, not caching');
        return;
      }

      const cacheData: CacheData<Article[]> = {
        data,
        timestamp: Date.now()
      };

      // Use a temporary file first
      const tempFile = `${RECENT_ARTICLES_CACHE_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(cacheData, null, 2));

      // Rename to actual cache file (atomic operation)
      fs.renameSync(tempFile, RECENT_ARTICLES_CACHE_FILE);

      // console.log('Recent articles cached successfully');
    } catch (error) {
      console.error('Error caching recent articles:', error);
    } finally {
      // Always release lock
      this.releaseLock(cacheType);
    }
  }

  /**
   * Cache team members data with locking mechanism
   */
  static cacheTeamMembers(data: Team[]): void {
    const cacheType = 'team';

    // Try to acquire lock
    if (!this.acquireLock(cacheType)) {
      // console.warn(`Cannot cache team members: lock acquisition failed`);
      return;
    }

    try {
      // Validate data first
      if (!data || !Array.isArray(data)) {
        console.error('Invalid team members data structure, not caching');
        return;
      }

      const cacheData: CacheData<Team[]> = {
        data,
        timestamp: Date.now()
      };

      // Use a temporary file first
      const tempFile = `${TEAM_CACHE_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(cacheData, null, 2));

      // Rename to actual cache file (atomic operation)
      fs.renameSync(tempFile, TEAM_CACHE_FILE);

      // console.log('Team members cached successfully');
    } catch (error) {
      console.error('Error caching team members:', error);
    } finally {
      // Always release lock
      this.releaseLock(cacheType);
    }
  }

  /**
   * Cache quotes data with locking mechanism
   */
  static cacheQuotes(data: CarouselQuote[]): void {
    const cacheType = 'quotes';

    // Try to acquire lock
    if (!this.acquireLock(cacheType)) {
      // console.warn(`Cannot cache quotes: lock acquisition failed`);
      return;
    }

    try {
      // Validate data first
      if (!data || !Array.isArray(data)) {
        console.error('Invalid quotes data structure, not caching');
        return;
      }

      const cacheData: CacheData<CarouselQuote[]> = {
        data,
        timestamp: Date.now()
      };

      // Use a temporary file first
      const tempFile = `${QUOTES_CACHE_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(cacheData, null, 2));

      // Rename to actual cache file (atomic operation)
      fs.renameSync(tempFile, QUOTES_CACHE_FILE);

      // console.log('Quotes cached successfully');
    } catch (error) {
      console.error('Error caching quotes:', error);
    } finally {
      // Always release lock
      this.releaseLock(cacheType);
    }
  }

  /**
   * Per-cache invalidation counter.
   *
   * A refresh that started fetching before an invalidation still holds the old
   * data; if it writes afterwards it puts the stale copy straight back, and the
   * site keeps serving it until the cache expires. Writers capture the
   * generation before fetching and skip the write if it has moved since.
   */
  private static generations: Record<string, number> = {};

  /** Current invalidation generation for a cache type. */
  static getGeneration(cacheType: string): number {
    return this.generations[cacheType] ?? 0;
  }

  /** Whether `cacheType` has been invalidated since `generation` was read. */
  static isStale(cacheType: string, generation: number): boolean {
    return this.getGeneration(cacheType) !== generation;
  }

  private static cacheFileFor(cacheType: string): string | null {
    switch (cacheType) {
      case 'articles': return ARTICLES_CACHE_FILE;
      case 'featuredArticles': return FEATURED_ARTICLES_CACHE_FILE;
      case 'recentArticles': return RECENT_ARTICLES_CACHE_FILE;
      case 'team': return TEAM_CACHE_FILE;
      case 'quotes': return QUOTES_CACHE_FILE;
      default: return null;
    }
  }

  /**
   * Invalidate a specific cache.
   *
   * This must not be skipped when another write holds the lock: a silently
   * dropped invalidation leaves the old copy live for the full cache expiry.
   * Deleting the file is safe without the lock (the writer renames a temp file
   * into place, and bumping the generation makes it discard stale data first),
   * so the lock only guards cleanup of the writer's temp file.
   *
   * @param cacheType The type of cache to invalidate ('articles', 'featuredArticles', 'recentArticles', 'team', 'quotes')
   */
  static invalidateCache(cacheType: string): void {
    const cacheFile = this.cacheFileFor(cacheType);
    if (!cacheFile) {
      return;
    }

    this.generations[cacheType] = this.getGeneration(cacheType) + 1;

    const locked = this.acquireLock(cacheType);

    try {
      if (fs.existsSync(cacheFile)) {
        fs.unlinkSync(cacheFile);
      }

      // Only clean up the temp file when no writer is using it.
      const tempFile = `${cacheFile}.tmp`;
      if (locked && fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    } catch (error) {
      console.error(`Error invalidating cache for ${cacheType}:`, error);
    } finally {
      if (locked) {
        this.releaseLock(cacheType);
      }
    }
  }

  /**
   * Invalidate all caches, with proper error handling for each cache type
   */
  static invalidateAllCaches(): void {
    const cacheTypes = ['articles', 'featuredArticles', 'recentArticles', 'team', 'quotes'];

    for (const cacheType of cacheTypes) {
      this.invalidateCache(cacheType);
    }
  }
}