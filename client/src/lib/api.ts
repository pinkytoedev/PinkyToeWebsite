import { Article, CarouselQuote, Team } from "@shared/schema";
import { API_ROUTES, ITEMS_PER_PAGE } from "@/lib/constants";

// Helper function to check response status
function isResponseValid(res: Response): boolean {
  // 304 Not Modified is a valid response for cached content
  return res.ok || res.status === 304;
}

export async function fetchFeaturedArticles(): Promise<Article[] | undefined> {
  const res = await fetch(API_ROUTES.FEATURED_ARTICLES);
  if (!isResponseValid(res)) throw new Error("Failed to fetch featured articles");
  // Return undefined for 304 so TanStack Query will use the cached data
  return res.status === 304 ? undefined : res.json();
}

export async function fetchRecentArticles(limit = 4): Promise<Article[] | undefined> {
  const res = await fetch(`${API_ROUTES.RECENT_ARTICLES}?limit=${limit}`);
  if (!isResponseValid(res)) throw new Error("Failed to fetch recent articles");
  // Return undefined for 304 so TanStack Query will use the cached data
  return res.status === 304 ? undefined : res.json();
}

export async function fetchArticles(
  page = 1, 
  search?: string
): Promise<{ articles: Article[], total: number } | undefined> {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  const res = await fetch(
    `${API_ROUTES.ARTICLES}?page=${page}&limit=${ITEMS_PER_PAGE}${searchParam}`
  );
  if (!isResponseValid(res)) throw new Error("Failed to fetch articles");
  
  // Return undefined for 304 so TanStack Query will use the cached data
  return res.status === 304 ? undefined : res.json();
}

export async function fetchArticleById(id: string): Promise<Article | undefined> {
  const res = await fetch(API_ROUTES.ARTICLE_BY_ID(id));
  if (!isResponseValid(res)) throw new Error(`Failed to fetch article with id ${id}`);
  
  // Return undefined for 304 so TanStack Query will use the cached data
  return res.status === 304 ? undefined : res.json();
}

export async function fetchTeamMembers(): Promise<Team[] | undefined> {
  const res = await fetch(API_ROUTES.TEAM);
  if (!isResponseValid(res)) throw new Error("Failed to fetch team members");
  // Return undefined for 304 so TanStack Query will use the cached data
  return res.status === 304 ? undefined : res.json();
}

export async function fetchTeamMemberById(id: string): Promise<Team | undefined> {
  const res = await fetch(API_ROUTES.TEAM_MEMBER_BY_ID(id));
  if (!isResponseValid(res)) throw new Error(`Failed to fetch team member with id ${id}`);
  
  // Return undefined for 304 so TanStack Query will use the cached data
  return res.status === 304 ? undefined : res.json();
}

export async function fetchQuotes(): Promise<CarouselQuote[] | undefined> {
  const res = await fetch(API_ROUTES.QUOTES);
  if (!isResponseValid(res)) throw new Error("Failed to fetch quotes");
  // Return undefined for 304 so TanStack Query will use the cached data
  return res.status === 304 ? undefined : res.json();
}

export async function fetchQuoteOfDay(): Promise<CarouselQuote | undefined> {
  const res = await fetch(API_ROUTES.QUOTE_OF_DAY);
  if (!isResponseValid(res)) throw new Error("Failed to fetch quote of the day");
  
  // Return undefined for 304 so TanStack Query will use the cached data
  return res.status === 304 ? undefined : res.json();
}
