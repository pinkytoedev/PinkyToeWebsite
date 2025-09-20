import { Article, CarouselQuote, Team } from "@shared/schema";
import { API_ROUTES, ITEMS_PER_PAGE } from "@/lib/constants";

export async function fetchFeaturedArticles(): Promise<Article[]> {
  const res = await fetch(API_ROUTES.FEATURED_ARTICLES);
  if (!res.ok) throw new Error("Failed to fetch featured articles");
  return res.json();
}

export async function fetchRecentArticles(limit = 4): Promise<Article[]> {
  const res = await fetch(`${API_ROUTES.RECENT_ARTICLES}?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch recent articles");
  return res.json();
}

export async function fetchArticles(
  page = 1,
  search?: string
): Promise<{ articles: Article[], total: number }> {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  const res = await fetch(
    `${API_ROUTES.ARTICLES}?page=${page}&limit=${ITEMS_PER_PAGE}${searchParam}`
  );
  if (!res.ok) throw new Error("Failed to fetch articles");
  return res.json();
}

export async function fetchArticleById(id: string): Promise<Article> {
  const res = await fetch(API_ROUTES.ARTICLE_BY_ID(id));
  if (!res.ok) throw new Error(`Failed to fetch article with id ${id}`);
  return res.json();
}

export async function fetchArticlesByIds(ids: string[]): Promise<Article[]> {
  if (!ids || ids.length === 0) return [];

  // Fetch all articles concurrently
  const promises = ids.map(id =>
    fetchArticleById(id).catch(error => {
      console.warn(`Failed to fetch article ${id}:`, error);
      return null;
    })
  );

  const results = await Promise.all(promises);
  // Filter out null results (failed fetches)
  return results.filter((article): article is Article => article !== null);
}

export async function fetchTeamMembers(): Promise<Team[]> {
  const res = await fetch(API_ROUTES.TEAM);
  if (!res.ok) throw new Error("Failed to fetch team members");
  return res.json();
}

export async function fetchTeamMemberById(id: string): Promise<Team> {
  const res = await fetch(API_ROUTES.TEAM_MEMBER_BY_ID(id));
  if (!res.ok) throw new Error(`Failed to fetch team member with id ${id}`);
  return res.json();
}

export async function fetchArticlesByTeamMemberId(id: string): Promise<Article[]> {
  const res = await fetch(API_ROUTES.ARTICLES_BY_TEAM_MEMBER(id));
  if (!res.ok) throw new Error(`Failed to fetch articles for team member with id ${id}`);
  return res.json();
}

export async function fetchQuotes(): Promise<CarouselQuote[]> {
  const res = await fetch(API_ROUTES.QUOTES);
  if (!res.ok) throw new Error("Failed to fetch quotes");
  return res.json();
}

export async function fetchQuoteOfDay(): Promise<CarouselQuote> {
  const res = await fetch(API_ROUTES.QUOTE_OF_DAY);
  if (!res.ok) throw new Error("Failed to fetch quote of the day");
  return res.json();
}
