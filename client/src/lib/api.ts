import { Article, CarouselQuote, Team } from "@shared/schema";
import { API_ROUTES, ITEMS_PER_PAGE } from "@/lib/constants";

// Helper function to check response status
function isResponseValid(res: Response): boolean {
  // 304 Not Modified is a valid response for cached content
  return res.ok || res.status === 304;
}

export async function fetchFeaturedArticles(): Promise<Article[]> {
  const res = await fetch(API_ROUTES.FEATURED_ARTICLES);
  if (!isResponseValid(res)) throw new Error("Failed to fetch featured articles");
  return res.status === 304 ? [] : res.json(); // Return empty array for 304, TanStack will use cache
}

export async function fetchRecentArticles(limit = 4): Promise<Article[]> {
  const res = await fetch(`${API_ROUTES.RECENT_ARTICLES}?limit=${limit}`);
  if (!isResponseValid(res)) throw new Error("Failed to fetch recent articles");
  return res.status === 304 ? [] : res.json(); // Return empty array for 304, TanStack will use cache
}

export async function fetchArticles(
  page = 1, 
  search?: string
): Promise<{ articles: Article[], total: number }> {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  const res = await fetch(
    `${API_ROUTES.ARTICLES}?page=${page}&limit=${ITEMS_PER_PAGE}${searchParam}`
  );
  if (!isResponseValid(res)) throw new Error("Failed to fetch articles");
  
  // Return empty result for 304, TanStack will use cache
  return res.status === 304 ? { articles: [], total: 0 } : res.json();
}

export async function fetchArticleById(id: string): Promise<Article> {
  const res = await fetch(API_ROUTES.ARTICLE_BY_ID(id));
  if (!isResponseValid(res)) throw new Error(`Failed to fetch article with id ${id}`);
  
  // For 304, return empty object, TanStack will use cache
  if (res.status === 304) {
    return {} as Article;
  }
  return res.json();
}

export async function fetchTeamMembers(): Promise<Team[]> {
  const res = await fetch(API_ROUTES.TEAM);
  if (!isResponseValid(res)) throw new Error("Failed to fetch team members");
  return res.status === 304 ? [] : res.json(); // Return empty array for 304, TanStack will use cache
}

export async function fetchTeamMemberById(id: string): Promise<Team> {
  const res = await fetch(API_ROUTES.TEAM_MEMBER_BY_ID(id));
  if (!isResponseValid(res)) throw new Error(`Failed to fetch team member with id ${id}`);
  
  // For 304, return empty object, TanStack will use cache
  if (res.status === 304) {
    return {} as Team;
  }
  return res.json();
}

export async function fetchQuotes(): Promise<CarouselQuote[]> {
  const res = await fetch(API_ROUTES.QUOTES);
  if (!isResponseValid(res)) throw new Error("Failed to fetch quotes");
  return res.status === 304 ? [] : res.json(); // Return empty array for 304, TanStack will use cache
}

export async function fetchQuoteOfDay(): Promise<CarouselQuote> {
  const res = await fetch(API_ROUTES.QUOTE_OF_DAY);
  if (!isResponseValid(res)) throw new Error("Failed to fetch quote of the day");
  
  // For 304, return empty object, TanStack will use cache
  if (res.status === 304) {
    return {} as CarouselQuote;
  }
  return res.json();
}
