import { Article, CarouselQuote, Team } from "@shared/schema";
import { ITEMS_PER_PAGE } from "@/lib/constants";

// Base path for GitHub Pages
const BASE_PATH = '/PinkyToeWebsite';

// Helper function to fetch static JSON files
async function fetchStaticJSON(path: string) {
  const res = await fetch(`${BASE_PATH}${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  const json = await res.json();
  // Extract data from wrapper if present
  return json.data || json;
}

export async function fetchFeaturedArticles(): Promise<Article[]> {
    return fetchStaticJSON('/data/featured-articles.json');
}

export async function fetchRecentArticles(limit = 4): Promise<Article[]> {
    const articles = await fetchStaticJSON('/data/recent-articles.json');
    return articles.slice(0, limit);
}

export async function fetchArticles(
  page = 1, 
  search?: string
): Promise<{ articles: Article[], total: number }> {
  const data = await fetchStaticJSON('/data/articles.json');
  // Handle different possible structures
  const allArticles: Article[] = data.articles || data;
  
  // Filter by search term if provided
  let filtered = allArticles;
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = allArticles.filter(article => 
      article.title.toLowerCase().includes(searchLower) ||
      article.author.toLowerCase().includes(searchLower) ||
      (article.tags && article.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  }
  
  // Paginate
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const articles = filtered.slice(start, end);
  
  return { articles, total: filtered.length };
}

export async function fetchArticleById(id: string): Promise<Article> {
  const data = await fetchStaticJSON('/data/articles.json');
  const articles: Article[] = data.articles || data;
  const article = articles.find(a => a.id === id);
  if (!article) throw new Error(`Article with id ${id} not found`);
  return article;
}

export async function fetchTeamMembers(): Promise<Team[]> {
    return fetchStaticJSON('/data/team.json');
}

export async function fetchTeamMemberById(id: string): Promise<Team> {
    const team: Team[] = await fetchStaticJSON('/data/team.json');
    const member = team.find(m => m.id === id);
    if (!member) throw new Error(`Team member with id ${id} not found`);
    return member;
}

export async function fetchQuotes(): Promise<CarouselQuote[]> {
    return fetchStaticJSON('/data/quotes.json');
}

export async function fetchArticlesByTeamMemberId(teamMemberId: string): Promise<Article[]> {
    // First get the team member to get their name
    const teamMember = await fetchTeamMemberById(teamMemberId);
    if (!teamMember) return [];
    
    // Then get all articles and filter by author name
    const data = await fetchStaticJSON('/data/articles.json');
    const articles: Article[] = data.articles || data;
    
    return articles.filter(article => {
        // Handle both string and array formats for article.name
        const authorName = Array.isArray(article.name) ? article.name[0] : article.name;
        return authorName === teamMember.name;
    });
}

export async function refreshAirtableData(): Promise<void> {
    // No-op for static deployment
    console.log('Data refresh not available in static deployment');
}

export async function clearAllCaches(): Promise<void> {
    // No-op for static deployment
    console.log('Cache clearing not available in static deployment');
}