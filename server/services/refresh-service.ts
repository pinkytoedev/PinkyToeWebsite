import { storage } from "../storage";
import { CacheService } from "./cache-service";
import { PublicationScheduler } from "./publication-scheduler";
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

// Track timers for cleanup
let refreshTimers: NodeJS.Timeout[] = [];

/**
 * Publication-aware refresh service
 * Handles background data refresh with business hours awareness and content priority tiers
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
  private static readonly MIN_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes (reduced for better publication responsiveness)

  // How often to check whether we've crossed a business-hours boundary
  private static readonly SCHEDULE_MONITOR_INTERVAL = 15 * 60 * 1000; // 15 minutes

  // Only arm a release timer for something due within this window; anything
  // further out gets re-armed by a later refresh, closer to the time.
  private static readonly RELEASE_SCHEDULING_HORIZON = 25 * 60 * 60 * 1000; // 25 hours

  // Fire fractionally after the release instant, never before it.
  private static readonly RELEASE_TIMER_CUSHION = 2 * 1000; // 2 seconds

  /**
   * Start all refresh schedules with publication-aware timing
   */
  static startRefreshSchedules(): void {
    // console.log('Starting publication-aware data refresh schedules...');

    // Initial refresh of all data
    this.refreshAll();

    // Start dynamic scheduling that adapts to business hours
    this.startDynamicScheduling();

    // console.log('Publication-aware refresh schedules started successfully');
  }

  /**
   * Start dynamic scheduling that adapts to business hours
   */
  private static startDynamicScheduling(): void {
    // Schedule refreshes based on current business hours status
    this.scheduleNextRefreshCycle();

    // Set up a timer to transition between business/off-hours scheduling
    // Check every 15 minutes if we need to adjust intervals
    const scheduleMonitor = setInterval(() => {
      this.checkAndUpdateScheduling();
    }, this.SCHEDULE_MONITOR_INTERVAL);

    refreshTimers.push(scheduleMonitor);
  }

  /**
   * Schedule the next refresh cycle based on current time
   */
  private static scheduleNextRefreshCycle(): void {
    // Clear existing timers first
    this.clearContentRefreshTimers();

    // Remember which schedule these timers were built for, so the monitor can
    // tell a real business-hours transition apart from a routine check-in.
    this.scheduledForBusinessHours = PublicationScheduler.isBusinessHours();

    // Get current intervals based on business hours
    const recentArticlesInterval = PublicationScheduler.getRefreshInterval('critical'); // Recent articles are critical
    const featuredArticlesInterval = PublicationScheduler.getRefreshInterval('important'); // Featured articles are important  
    const articlesInterval = PublicationScheduler.getRefreshInterval('important'); // All articles are important
    const teamInterval = PublicationScheduler.getRefreshInterval('stable'); // Team is stable
    const quotesInterval = PublicationScheduler.getRefreshInterval('stable'); // Quotes are stable

    // Schedule periodic refreshes with current intervals
    const recentArticlesTimer = setInterval(() => this.refreshRecentArticles(), recentArticlesInterval);
    const featuredArticlesTimer = setInterval(() => this.refreshFeaturedArticles(), featuredArticlesInterval);
    const articlesTimer = setInterval(() => this.refreshArticles(), articlesInterval);
    const teamTimer = setInterval(() => this.refreshTeam(), teamInterval);
    const quotesTimer = setInterval(() => this.refreshQuotes(), quotesInterval);

    // Store timers for cleanup (separate from monitor timer)
    this.contentRefreshTimers = [recentArticlesTimer, featuredArticlesTimer, articlesTimer, teamTimer, quotesTimer];
  }

  /**
   * Clear content refresh timers (but not the monitor timer)
   */
  private static contentRefreshTimers: NodeJS.Timeout[] = [];

  /** Business-hours state the current content timers were scheduled for. */
  private static scheduledForBusinessHours: boolean | null = null;

  private static clearContentRefreshTimers(): void {
    this.contentRefreshTimers.forEach(timer => clearInterval(timer));
    this.contentRefreshTimers = [];
  }

  /**
   * Check if we need to update scheduling (e.g., transition from business to off-hours)
   *
   * Only reschedules on an actual business-hours transition. Rescheduling on every
   * check would clear and recreate the content timers every SCHEDULE_MONITOR_INTERVAL,
   * and since the shortest content interval (30 min) is longer than that, no content
   * timer would ever survive long enough to fire.
   */
  private static checkAndUpdateScheduling(): void {
    const isBusinessHours = PublicationScheduler.isBusinessHours();

    if (isBusinessHours === this.scheduledForBusinessHours) {
      return; // No transition - leave the running timers alone.
    }

    this.scheduleNextRefreshCycle();
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
    // Just refresh recent articles (most important for user experience)
    // Skip other refreshes to reduce API load
    await this.refreshRecentArticles();
  }

  /**
   * Arm a one-shot timer for the next scheduled article's release moment.
   *
   * The periodic tiers refresh every 30 minutes to 6 hours, so on their own an
   * article set for 08:00 could sit invisible for hours past its time. This
   * fires at the moment itself and republishes the article views.
   *
   * Called after every article refresh, so newly scheduled work is picked up
   * on the next cycle (or immediately, via the publication webhook).
   */
  static async scheduleNextRelease(): Promise<void> {
    this.clearReleaseTimer();

    let releaseAt: Date | null = null;
    try {
      releaseAt = await storage.getNextReleaseTime();
    } catch (error) {
      console.error('Could not determine next scheduled release:', error);
      return;
    }

    if (!releaseAt) {
      return; // Nothing embargoed.
    }

    const delay = releaseAt.getTime() - Date.now();

    // Beyond the horizon the periodic refresh will re-arm this closer to the
    // time; setTimeout also can't represent delays past ~24.8 days.
    if (delay > this.RELEASE_SCHEDULING_HORIZON) {
      return;
    }

    // A release that is already due (or arrives while we're arming) still needs
    // a positive delay, and a small cushion avoids firing a hair early and
    // filtering the article straight back out.
    const timerDelay = Math.max(delay, 0) + this.RELEASE_TIMER_CUSHION;

    console.log(
      `Next scheduled release at ${releaseAt.toLocaleString('en-US', {
        timeZone: PublicationScheduler.getTimezone()
      })} (in ${Math.round(timerDelay / 1000)}s)`
    );

    this.releaseTimer = setTimeout(() => {
      this.publishScheduledRelease().catch(error => {
        console.error('Scheduled release refresh failed:', error);
      });
    }, timerDelay);
  }

  /**
   * Refresh the article views at a release boundary, then look for the next one.
   *
   * Bypasses MIN_REFRESH_INTERVAL deliberately: the whole point is that the
   * content changed at a known instant, so the throttle would defeat it.
   */
  private static async publishScheduledRelease(): Promise<void> {
    console.log('Scheduled release reached, refreshing article caches');

    this.lastRefreshTime.articles = 0;
    this.lastRefreshTime.featuredArticles = 0;
    this.lastRefreshTime.recentArticles = 0;

    CacheService.invalidateCache('articles');
    CacheService.invalidateCache('featuredArticles');
    CacheService.invalidateCache('recentArticles');

    await this.refreshRecentArticles();
    await this.refreshFeaturedArticles();
    await this.refreshArticles();

    // refreshArticles re-arms the timer for whatever is next in the queue.
  }

  private static releaseTimer: NodeJS.Timeout | null = null;

  private static clearReleaseTimer(): void {
    if (this.releaseTimer) {
      clearTimeout(this.releaseTimer);
      this.releaseTimer = null;
    }
  }

  /**
   * Stop all refresh schedules
   */
  static stopRefreshSchedules(): void {
    // console.log('Stopping publication-aware refresh schedules...');
    refreshTimers.forEach(timer => clearInterval(timer));
    refreshTimers = [];
    this.clearContentRefreshTimers();
    this.clearReleaseTimer();
    // console.log('Publication-aware refresh schedules stopped');
  }


  /**
   * Warm up all caches on server start
   * Ensures fresh data is available immediately
   */
  static async warmupCache(): Promise<void> {
    // console.log('🔥 Cache warmup started...');

    try {
      // Refresh all content in priority order
      await this.refreshRecentArticles(); // Critical first
      await this.refreshFeaturedArticles(); // Important second
      await this.refreshArticles(); // Important third

      // Stable content can load in background
      Promise.all([
        this.refreshTeam(),
        this.refreshQuotes()
      ]).catch(error => {
        console.error('Background warmup error (non-critical):', error);
      });

      // console.log('🔥 Cache warmup completed');
    } catch (error) {
      console.error('🔥 Cache warmup failed:', error);
      // Don't throw - server should still start even if warmup fails
    }
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
    const otherUrls = new Set<string>();

    // First pass: collect all URLs and deduplicate them
    for (const article of articles) {
      // Prioritize the primary imageUrl
      if (article.imageUrl) {
        if (article.imageUrl.includes('imgur.com')) {
          imgurUrls.add(article.imageUrl);
        } else {
          otherUrls.add(article.imageUrl);
        }
      }

      // Only use imagePath as fallback if imageUrl doesn't exist
      if (!article.imageUrl && article.imagePath && article.imagePath !== null) {
        if (article.imagePath.includes('imgur.com')) {
          imgurUrls.add(article.imagePath);
        } else {
          otherUrls.add(article.imagePath);
        }
      }

      // Skip the Airtable attachment structure since we're now using MainImageLink
    }


    // Process non-Imgur URLs first (typically less rate-limited)
    const otherPromises: Promise<void>[] = [];
    Array.from(otherUrls).forEach(url => {
      otherPromises.push(this.preCacheImage(url));
    });

    // Process non-Imgur URLs with higher concurrency
    const otherBatchSize = 5;
    for (let i = 0; i < otherPromises.length; i += otherBatchSize) {
      const batch = otherPromises.slice(i, i + otherBatchSize);
      await Promise.all(batch);
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

  }

  /**
   * Pre-cache all image URLs from team members
   * Optimized to minimize Imgur API requests and respect rate limits
   */
  static async preCacheTeamImages(teamMembers: Team[]): Promise<void> {
    if (!teamMembers || !teamMembers.length) return;

    const imgurUrls = new Set<string>();
    const otherUrls = new Set<string>();

    // First pass: collect all URLs and deduplicate them
    for (const member of teamMembers) {
      // Prioritize the primary imageUrl
      if (member.imageUrl) {
        if (member.imageUrl.includes('imgur.com')) {
          imgurUrls.add(member.imageUrl);
        } else {
          otherUrls.add(member.imageUrl);
        }
      }

      // Only use imagePath as fallback if imageUrl doesn't exist
      if (!member.imageUrl && member.imagePath && member.imagePath !== null) {
        if (member.imagePath.includes('imgur.com')) {
          imgurUrls.add(member.imagePath);
        } else {
          otherUrls.add(member.imagePath);
        }
      }

      // Skip the Airtable attachment structure since we're now using MainImageLink
    }


    // Process non-Imgur URLs first (typically less rate-limited)
    const otherPromises: Promise<void>[] = [];
    Array.from(otherUrls).forEach(url => {
      otherPromises.push(this.preCacheImage(url));
    });

    // Process non-Imgur URLs with higher concurrency
    const otherBatchSize = 5;
    for (let i = 0; i < otherPromises.length; i += otherBatchSize) {
      const batch = otherPromises.slice(i, i + otherBatchSize);
      await Promise.all(batch);
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

  }

  /**
   * Refresh all data at once
   */
  /**
   * Invalidate and re-fetch a single content entity.
   *
   * Shared by the admin router and the legacy /api/cache/refresh endpoint so
   * the entity list and the invalidate-then-refresh ordering live in one place.
   */
  static async invalidateAndRefresh(entity: RefreshableEntity): Promise<void> {
    CacheService.invalidateCache(entity);
    await REFRESHERS[entity]();
  }

  static async refreshAll(): Promise<void> {
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
  }

  /**
   * Refresh articles
   */
  static async refreshArticles(): Promise<void> {
    try {
      // Check if it's too soon to refresh again
      const now = Date.now();
      if (now - this.lastRefreshTime.articles < this.MIN_REFRESH_INTERVAL) {
        return;
      }

      this.lastRefreshTime.articles = now;

      // Fetch the complete set. A partial batch would be cached as if it were
      // the whole collection, leaving every page past the batch empty.
      const result = await storage.getArticles(1, Number.MAX_SAFE_INTEGER);
      CacheService.cacheArticles(result);

      // The set we just cached excludes anything still embargoed, so this is
      // the point to (re-)arm the timer for whichever release is next.
      await this.scheduleNextRelease();

      // Pre-cache images from articles to handle Airtable's expiring URLs
      await this.preCacheArticleImages(result.articles);
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
        return;
      }

      this.lastRefreshTime.featuredArticles = now;

      const articles = await storage.getFeaturedArticles();
      CacheService.cacheFeaturedArticles(articles);

      // Pre-cache images from featured articles to handle Airtable's expiring URLs
      await this.preCacheArticleImages(articles);
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
        return;
      }

      this.lastRefreshTime.recentArticles = now;

      const articles = await storage.getRecentArticles(8); // Get more than default for cache
      CacheService.cacheRecentArticles(articles);

      // Pre-cache images from recent articles to handle Airtable's expiring URLs
      await this.preCacheArticleImages(articles);
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
        return;
      }

      this.lastRefreshTime.team = now;

      const team = await storage.getTeamMembers();
      CacheService.cacheTeamMembers(team);

      // Pre-cache images from team members to handle Airtable's expiring URLs
      await this.preCacheTeamImages(team);
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
        return;
      }

      this.lastRefreshTime.quotes = now;

      const quotes = await storage.getQuotes();
      CacheService.cacheQuotes(quotes);
    } catch (error) {
      console.error('Error refreshing quotes:', error);
    }
  }
}

/** Content entities that can be individually invalidated and re-fetched. */
export const REFRESHABLE_ENTITIES = [
  'articles',
  'featuredArticles',
  'recentArticles',
  'team',
  'quotes',
] as const;

export type RefreshableEntity = typeof REFRESHABLE_ENTITIES[number];

/** Narrowing guard for caller-supplied entity names. */
export function isRefreshableEntity(value: unknown): value is RefreshableEntity {
  return typeof value === 'string'
    && (REFRESHABLE_ENTITIES as readonly string[]).includes(value);
}

const REFRESHERS: Record<RefreshableEntity, () => Promise<void>> = {
  articles: () => RefreshService.refreshArticles(),
  featuredArticles: () => RefreshService.refreshFeaturedArticles(),
  recentArticles: () => RefreshService.refreshRecentArticles(),
  team: () => RefreshService.refreshTeam(),
  quotes: () => RefreshService.refreshQuotes(),
};
