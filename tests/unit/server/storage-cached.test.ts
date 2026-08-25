import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Article, Team, CarouselQuote } from '@shared/schema';
import { CachedStorage } from '@server/storage-cached';
import { CacheService } from '@server/services/cache-service';
import type { IStorage } from '@server/storage';

function makeArticle(n: number): Article {
  return {
    id: `rec${n}`,
    title: `Article ${n}`,
    description: '',
    content: '',
    contentFormat: 'plaintext',
    imageUrl: '',
    imageType: 'url',
    imagePath: null,
    featured: false,
    publishedAt: new Date(0),
    name: '',
    photo: '',
  };
}

const ALL_ARTICLES = Array.from({ length: 50 }, (_, i) => makeArticle(i));

/** Minimal origin that paginates in memory, like AirtableStorage does. */
function makeOrigin(articles: Article[]) {
  const getArticles = vi.fn(async (page: number, limit: number) => {
    const start = (page - 1) * limit;
    return {
      articles: articles.slice(start, start + limit),
      total: articles.length,
    };
  });

  return { getArticles } as unknown as IStorage & { getArticles: typeof getArticles };
}

describe('CachedStorage.getArticles', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not cache a partial page', async () => {
    // Regression: a cache miss for page 1 used to store {articles: 6 items,
    // total: 50}. Every later read then treated those 6 as the whole
    // collection, so pages 2+ came back empty forever.
    const origin = makeOrigin(ALL_ARTICLES);
    const cacheArticles = vi.spyOn(CacheService, 'cacheArticles').mockImplementation(() => {});
    vi.spyOn(CacheService, 'getCachedArticles').mockReturnValue(null);

    const result = await new CachedStorage(origin).getArticles(1, 6);

    expect(result.articles).toHaveLength(6);
    expect(result.total).toBe(50);
    expect(cacheArticles).not.toHaveBeenCalled();
  });

  it('caches a complete set', async () => {
    const origin = makeOrigin(ALL_ARTICLES);
    const cacheArticles = vi.spyOn(CacheService, 'cacheArticles').mockImplementation(() => {});
    vi.spyOn(CacheService, 'getCachedArticles').mockReturnValue(null);

    await new CachedStorage(origin).getArticles(1, 100);

    expect(cacheArticles).toHaveBeenCalledOnce();
    expect(cacheArticles.mock.calls[0][0].articles).toHaveLength(50);
  });

  it('falls through to origin for a page the partial cache does not cover', async () => {
    // Cache holds the first 20 of 50 (the refresh service fetches a batch).
    const origin = makeOrigin(ALL_ARTICLES);
    vi.spyOn(CacheService, 'getCachedArticles').mockReturnValue({
      articles: ALL_ARTICLES.slice(0, 20),
      total: 50,
    });

    const result = await new CachedStorage(origin).getArticles(5, 6); // items 24-29

    expect(origin.getArticles).toHaveBeenCalledWith(5, 6, '');
    expect(result.articles.map(a => a.id)).toEqual(
      ALL_ARTICLES.slice(24, 30).map(a => a.id)
    );
    expect(result.total).toBe(50);
  });

  it('serves a page the partial cache fully covers without hitting origin', async () => {
    const origin = makeOrigin(ALL_ARTICLES);
    vi.spyOn(CacheService, 'getCachedArticles').mockReturnValue({
      articles: ALL_ARTICLES.slice(0, 20),
      total: 50,
    });

    const result = await new CachedStorage(origin).getArticles(2, 6); // items 6-11

    expect(origin.getArticles).not.toHaveBeenCalled();
    expect(result.articles.map(a => a.id)).toEqual(
      ALL_ARTICLES.slice(6, 12).map(a => a.id)
    );
  });

  it('serves every page from a complete cache, including past the end', async () => {
    const origin = makeOrigin(ALL_ARTICLES);
    vi.spyOn(CacheService, 'getCachedArticles').mockReturnValue({
      articles: ALL_ARTICLES,
      total: 50,
    });

    const storage = new CachedStorage(origin);

    const lastPage = await storage.getArticles(9, 6); // items 48-49
    expect(lastPage.articles).toHaveLength(2);

    const pastEnd = await storage.getArticles(99, 6);
    expect(pastEnd.articles).toHaveLength(0);
    expect(pastEnd.total).toBe(50);

    expect(origin.getArticles).not.toHaveBeenCalled();
  });

  it('bypasses the cache for search queries', async () => {
    const origin = makeOrigin(ALL_ARTICLES);
    const getCached = vi.spyOn(CacheService, 'getCachedArticles');

    await new CachedStorage(origin).getArticles(1, 6, 'pinky');

    expect(getCached).not.toHaveBeenCalled();
    expect(origin.getArticles).toHaveBeenCalledWith(1, 6, 'pinky');
  });

  it('never caches search results', async () => {
    const origin = makeOrigin(ALL_ARTICLES);
    const cacheArticles = vi.spyOn(CacheService, 'cacheArticles').mockImplementation(() => {});

    await new CachedStorage(origin).getArticles(1, 100, 'pinky');

    expect(cacheArticles).not.toHaveBeenCalled();
  });

  it('degrades to the stale cache instead of throwing when origin fails', async () => {
    const origin = {
      getArticles: vi.fn().mockRejectedValue(new Error('Airtable down')),
    } as unknown as IStorage;

    vi.spyOn(CacheService, 'getCachedArticles').mockReturnValue({
      articles: ALL_ARTICLES.slice(0, 20),
      total: 50,
    });

    const storage = new CachedStorage(origin);

    // Page 5 isn't covered by the 20-item cache, so it goes to origin, which
    // fails. We still answer from what the cache has rather than erroring.
    const uncovered = await storage.getArticles(5, 6);
    expect(uncovered.articles).toEqual([]);
    expect(uncovered.total).toBe(50);

    // A page inside the cached slice is still served in full.
    const covered = await storage.getArticles(2, 6);
    expect(covered.articles.map(a => a.id)).toEqual(
      ALL_ARTICLES.slice(6, 12).map(a => a.id)
    );
  });
});
