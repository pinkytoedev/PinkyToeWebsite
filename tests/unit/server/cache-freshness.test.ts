import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { RefreshService } from '@server/services/refresh-service';
import { CacheService } from '@server/services/cache-service';
import { storage } from '@server/storage';
import type { Article } from '@shared/schema';

const CACHE_DIR = path.join(process.cwd(), 'cache');
const ARTICLES_FILE = path.join(CACHE_DIR, 'articles.json');

const article = (id: string) => ({ id, title: id }) as unknown as Article;

describe('publication refresh freshness', () => {
  beforeEach(() => {
    vi.spyOn(storage, 'getRecentArticles').mockResolvedValue([article('new')]);
    vi.spyOn(storage, 'getFeaturedArticles').mockResolvedValue([article('new')]);
    vi.spyOn(storage, 'getArticles').mockResolvedValue({ articles: [article('new')], total: 1 });
    vi.spyOn(storage, 'getNextReleaseTime').mockResolvedValue(null);
    vi.spyOn(RefreshService, 'preCacheArticleImages').mockResolvedValue(undefined);
  });

  afterEach(() => {
    RefreshService.stopRefreshSchedules();
    vi.restoreAllMocks();
  });

  it('refetches on a forced refresh even right after a routine one', async () => {
    // Regression: the publication webhook invalidated the caches, then called
    // the throttled refreshers, which returned early if anything had refreshed
    // in the last 15 minutes - leaving the caches emptied but never rebuilt.
    await RefreshService.refreshRecentArticles();
    vi.mocked(storage.getRecentArticles).mockClear();
    const cacheRecent = vi.spyOn(CacheService, 'cacheRecentArticles');

    await RefreshService.forceRefreshArticleCaches();

    expect(storage.getRecentArticles).toHaveBeenCalledTimes(1);
    expect(storage.getFeaturedArticles).toHaveBeenCalled();
    expect(storage.getArticles).toHaveBeenCalled();
    expect(cacheRecent).toHaveBeenCalledWith([article('new')]);
  });

  it('bypasses the throttle for an explicit single-entity refresh', async () => {
    await RefreshService.refreshFeaturedArticles();
    vi.mocked(storage.getFeaturedArticles).mockClear();

    await RefreshService.invalidateAndRefresh('featuredArticles');

    expect(storage.getFeaturedArticles).toHaveBeenCalledTimes(1);
  });

  it('does not write back data fetched before an invalidation', async () => {
    // A periodic refresh that started before the article changed still holds
    // the old copy. Writing it after the webhook's invalidation would keep the
    // stale article live until the cache expired.
    let resolveFetch!: (value: Article[]) => void;
    vi.mocked(storage.getFeaturedArticles).mockImplementationOnce(
      () => new Promise(resolve => { resolveFetch = resolve; })
    );
    const cacheFeatured = vi.spyOn(CacheService, 'cacheFeaturedArticles');

    const inFlight = RefreshService.invalidateAndRefresh('featuredArticles');
    await Promise.resolve();

    CacheService.invalidateCache('featuredArticles');
    resolveFetch([article('old')]);
    await inFlight;

    expect(cacheFeatured).not.toHaveBeenCalledWith([article('old')]);
  });

  it('invalidates even while another writer holds the lock', () => {
    // Regression: invalidation silently gave up when the lock was busy, so a
    // publish could leave the old copy in place for the full cache expiry.
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify({ data: { articles: [], total: 0 }, timestamp: Date.now() }));
    // Simulate another writer holding the lock. The lock files are shared on
    // disk with test files running in parallel, so stub rather than create one.
    vi.spyOn(CacheService as any, 'acquireLock').mockReturnValue(false);
    const releaseLock = vi.spyOn(CacheService as any, 'releaseLock');

    const before = CacheService.getGeneration('articles');
    CacheService.invalidateCache('articles');

    expect(fs.existsSync(ARTICLES_FILE)).toBe(false);
    expect(CacheService.getGeneration('articles')).toBe(before + 1);
    // The other writer's lock is not ours to release.
    expect(releaseLock).not.toHaveBeenCalled();
  });
});
