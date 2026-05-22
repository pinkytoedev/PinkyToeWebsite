import { Article, Team, CarouselQuote } from "@shared/schema";
import { IStorage } from "./storage";
import { CacheService } from "./services/cache-service";

/**
 * Cached storage decorator
 * Wraps the original storage implementation with caching functionality
 */
export class CachedStorage implements IStorage {
  private originalStorage: IStorage;

  constructor(storage: IStorage) {
    this.originalStorage = storage;
  }

  async getArticles(page: number, limit: number, search = ""): Promise<{ articles: Article[], total: number }> {
    try {
      // For search queries, bypass cache
      if (search) {
        return await this.originalStorage.getArticles(page, limit, search);
      }

      // Try to get from cache first
      const cachedArticles = CacheService.getCachedArticles();
      if (cachedArticles) {
        // Validate page number
        if (page < 1) {
          page = 1;
        }

        // Apply pagination to cached data
        const start = (page - 1) * limit;

        // Ensure that we're not trying to access beyond the end of the array
        if (start >= cachedArticles.articles.length) {
          return {
            articles: [],
            total: cachedArticles.total
          };
        }

        const end = Math.min(start + limit, cachedArticles.articles.length);
        const pagedArticles = cachedArticles.articles.slice(start, end);

        // Double-check integrity of paged results
        if (!pagedArticles || !Array.isArray(pagedArticles)) {
          throw new Error('Article pagination failed');
        }

        return {
          articles: pagedArticles,
          total: cachedArticles.total
        };
      }

      // If not in cache, get from original storage
      const result = await this.originalStorage.getArticles(page, limit, search);

      // Validate result before caching
      if (!result || !result.articles || !Array.isArray(result.articles)) {
        return { articles: [], total: 0 };
      }

      // Cache the result for future use (only cache first page without search)
      if (page === 1 && !search) {
        CacheService.cacheArticles(result);
      }

      return result;
    } catch (error) {
      console.error('Error in cached getArticles:', error);
      // Try to serve from cache even on error
      const cachedArticles = CacheService.getCachedArticles();
      if (cachedArticles) {
        // Validate page number
        if (page < 1) {
          page = 1;
        }

        // Apply pagination to cached data with improved safety
        const start = (page - 1) * limit;

        if (start >= cachedArticles.articles.length) {
          return {
            articles: [],
            total: cachedArticles.total
          };
        }

        const end = Math.min(start + limit, cachedArticles.articles.length);
        const pagedArticles = cachedArticles.articles.slice(start, end);

        return {
          articles: pagedArticles,
          total: cachedArticles.total
        };
      }

      // If no cache available, return empty result instead of throwing error
      return { articles: [], total: 0 };
    }
  }

  async getFeaturedArticles(): Promise<Article[]> {
    try {
      // Try to get from cache first
      const cachedArticles = CacheService.getCachedFeaturedArticles();
      if (cachedArticles) {
        // Double-check integrity of results
        if (!Array.isArray(cachedArticles)) {
          throw new Error('Invalid featured articles cache format');
        }

        return cachedArticles;
      }

      // If not in cache, get from original storage
      const articles = await this.originalStorage.getFeaturedArticles();

      // Validate before caching
      if (!articles || !Array.isArray(articles)) {
        return [];
      }

      // Cache the result for future use
      CacheService.cacheFeaturedArticles(articles);

      return articles;
    } catch (error) {
      console.error('Error in cached getFeaturedArticles:', error);
      // Try to serve from cache even on error
      const cachedArticles = CacheService.getCachedFeaturedArticles();
      if (cachedArticles) {
        // Double-check integrity of results even in fallback path
        if (!Array.isArray(cachedArticles)) {
          return [];
        }

        return cachedArticles;
      }

      // If no cache available, return empty array instead of throwing
      return [];
    }
  }

  async getRecentArticles(limit: number): Promise<Article[]> {
    try {
      // Ensure limit is valid
      if (limit <= 0) {
        console.warn('Invalid limit requested for recent articles:', limit);
        limit = 4; // Default to reasonable value
      }

      // Try to get from cache first
      const cachedArticles = CacheService.getCachedRecentArticles();
      if (cachedArticles) {
        // Double-check integrity of results
        if (!Array.isArray(cachedArticles)) {
          console.error('Recent articles cache is not an array, fetching from original storage');
          throw new Error('Invalid recent articles cache format');
        }

        // Apply limit to cached data
        return cachedArticles.slice(0, limit);
      }

      // If not in cache, get from original storage
      const articles = await this.originalStorage.getRecentArticles(limit);

      // Validate before caching
      if (!articles || !Array.isArray(articles)) {
        console.error('Invalid recent articles from original storage, not caching');
        return [];
      }

      // Cache the result for future use
      CacheService.cacheRecentArticles(articles);

      return articles;
    } catch (error) {
      console.error('Error in cached getRecentArticles:', error);
      // Try to serve from cache even on error
      const cachedArticles = CacheService.getCachedRecentArticles();
      if (cachedArticles) {

        // Double-check integrity of results even in fallback path
        if (!Array.isArray(cachedArticles)) {
          console.error('Recent articles cache is not an array, returning empty array');
          return [];
        }

        return cachedArticles.slice(0, limit);
      }

      // If no cache available, return empty array instead of throwing
      console.error('No recent articles cache available and original storage failed, returning empty array');
      return [];
    }
  }

  async getArticleById(id: string): Promise<Article | undefined> {
    try {
      // Try to find in the cached articles first
      const cachedArticles = CacheService.getCachedArticles();
      if (cachedArticles) {
        const cachedArticle = cachedArticles.articles.find(article => article.id === id);
        if (cachedArticle) {
          return cachedArticle;
        }
      }

      // If not in cache, get from original storage
      return await this.originalStorage.getArticleById(id);
    } catch (error) {
      console.error(`Error in cached getArticleById for ${id}:`, error);

      // Try to find in the cached articles after error
      const cachedArticles = CacheService.getCachedArticles();
      if (cachedArticles) {
        const cachedArticle = cachedArticles.articles.find(article => article.id === id);
        if (cachedArticle) {
          return cachedArticle;
        }
      }

      // If not found in cache or error occurred, return undefined
      return undefined;
    }
  }

  async getArticlesByAuthorId(authorId: string): Promise<Article[]> {
    try {
      // Try to build from cached articles first
      const cachedArticles = CacheService.getCachedArticles();
      if (cachedArticles) {
        const teamMembers = CacheService.getCachedTeamMembers();
        if (teamMembers) {
          const teamMember = teamMembers.find(member => member.id === authorId);
          if (teamMember) {
            const authorArticles = cachedArticles.articles.filter(
              article => article.name === teamMember.name
            );
            if (authorArticles.length > 0) {
              return authorArticles;
            }
          }
        }
      }

      // If not in cache, get from original storage
      return await this.originalStorage.getArticlesByAuthorId(authorId);
    } catch (error) {
      console.error(`Error in cached getArticlesByAuthorId for ${authorId}:`, error);

      // Try to build from cached articles after error
      const cachedArticles = CacheService.getCachedArticles();
      if (cachedArticles) {
        const teamMembers = CacheService.getCachedTeamMembers();
        if (teamMembers) {
          const teamMember = teamMembers.find(member => member.id === authorId);
          if (teamMember) {
            const authorArticles = cachedArticles.articles.filter(
              article => article.name === teamMember.name
            );
            if (authorArticles.length > 0) {
              return authorArticles;
            }
          }
        }
      }

      // If no cache available, return empty array
      return [];
    }
  }

  async getTeamMembers(): Promise<Team[]> {
    try {
      // Try to get from cache first
      const cachedTeam = CacheService.getCachedTeamMembers();
      if (cachedTeam) {
        return cachedTeam;
      }

      // If not in cache, get from original storage
      const team = await this.originalStorage.getTeamMembers();

      // Cache the result for future use
      CacheService.cacheTeamMembers(team);

      return team;
    } catch (error) {
      console.error('Error in cached getTeamMembers:', error);
      // Try to serve from cache even on error
      const cachedTeam = CacheService.getCachedTeamMembers();
      if (cachedTeam) {
        return cachedTeam;
      }

      // If no cache available, rethrow
      throw error;
    }
  }

  async getTeamMemberById(id: string): Promise<Team | undefined> {
    try {
      // Try to find in the cached team first
      const cachedTeam = CacheService.getCachedTeamMembers();
      if (cachedTeam) {
        const cachedMember = cachedTeam.find(member => member.id === id);
        if (cachedMember) {
          return cachedMember;
        }
      }

      // If not in cache, get from original storage
      return await this.originalStorage.getTeamMemberById(id);
    } catch (error) {
      console.error(`Error in cached getTeamMemberById for ${id}:`, error);

      // Try to find in the cached team after error
      const cachedTeam = CacheService.getCachedTeamMembers();
      if (cachedTeam) {
        const cachedMember = cachedTeam.find(member => member.id === id);
        if (cachedMember) {
          return cachedMember;
        }
      }

      // If not found in cache or error occurred, return undefined
      return undefined;
    }
  }

  async getQuotes(): Promise<CarouselQuote[]> {
    try {
      // Try to get from cache first
      const cachedQuotes = CacheService.getCachedQuotes();
      if (cachedQuotes) {
        return cachedQuotes;
      }

      // If not in cache, get from original storage
      const quotes = await this.originalStorage.getQuotes();

      // Cache the result for future use
      CacheService.cacheQuotes(quotes);

      return quotes;
    } catch (error) {
      console.error('Error in cached getQuotes:', error);
      // Try to serve from cache even on error
      const cachedQuotes = CacheService.getCachedQuotes();
      if (cachedQuotes) {
        return cachedQuotes;
      }

      // If no cache available, rethrow
      throw error;
    }
  }

  async getQuoteOfDay(): Promise<CarouselQuote> {
    try {
      // Get all quotes from cache first
      const cachedQuotes = CacheService.getCachedQuotes();
      if (cachedQuotes && cachedQuotes.length > 0) {

        // Filter for philosophy quotes
        const philosophyQuotes = cachedQuotes.filter(quote =>
          quote.carousel.toLowerCase() === 'philo' ||
          quote.carousel.toLowerCase() === 'philosophy'
        );

        // Handle case where no philosophy quotes are available
        if (philosophyQuotes.length === 0) {
          if (cachedQuotes.length > 0) {
            // If we have any quotes, use the day of year to select one deterministically
            const today = new Date();
            const start = new Date(today.getFullYear(), 0, 0);
            const diff = today.getTime() - start.getTime();
            const oneDay = 1000 * 60 * 60 * 24;
            const dayOfYear = Math.floor(diff / oneDay);

            const quoteIndex = dayOfYear % cachedQuotes.length;
            return cachedQuotes[quoteIndex];
          } else {
            // If no quotes at all, return a default empty quote
            return {
              id: 0,
              carousel: 'default',
              quote: ''
            };
          }
        }

        // Use the day of year to select a quote deterministically
        const today = new Date();
        const start = new Date(today.getFullYear(), 0, 0);
        const diff = today.getTime() - start.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        const quoteIndex = dayOfYear % philosophyQuotes.length;
        return philosophyQuotes[quoteIndex];
      }

      // If not in cache, get from original storage
      return await this.originalStorage.getQuoteOfDay();
    } catch (error) {
      console.error('Error in cached getQuoteOfDay:', error);

      // Try one more time with cached quotes
      const cachedQuotes = CacheService.getCachedQuotes();
      if (cachedQuotes && cachedQuotes.length > 0) {
        // Get a random quote as fallback
        const randomIndex = Math.floor(Math.random() * cachedQuotes.length);
        return cachedQuotes[randomIndex];
      }

      // If all else fails, return a default quote
      return {
        id: 0,
        carousel: 'default',
        quote: ''
      };
    }
  }
}