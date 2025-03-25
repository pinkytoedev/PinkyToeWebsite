import { Article, CarouselQuote, Team } from "@shared/schema";
import { API_ROUTES, ITEMS_PER_PAGE } from "@/lib/constants";

// Helper function to check response status
function isResponseValid(res: Response): boolean {
  return res.ok;
}

// Helper function to handle 304 responses by making a new request with cache busting
async function handleCachedResponse(url: string): Promise<Response> {
  // Add cache busting parameter
  const cacheBustUrl = new URL(url, window.location.origin);
  cacheBustUrl.searchParams.append('_cb', Date.now().toString());
  
  return fetch(cacheBustUrl.toString(), {
    credentials: "include",
    headers: {
      "Cache-Control": "no-cache",
      "Pragma": "no-cache"
    }
  });
}

export async function fetchFeaturedArticles(): Promise<Article[]> {
  let res = await fetch(API_ROUTES.FEATURED_ARTICLES, {
    headers: {
      "Cache-Control": "no-cache",
      "Pragma": "no-cache"
    }
  });
  
  // If we get a 304, try again with cache busting
  if (res.status === 304) {
    console.log('304 response for featured articles, fetching fresh data');
    res = await handleCachedResponse(API_ROUTES.FEATURED_ARTICLES);
  }
  
  if (!isResponseValid(res)) throw new Error("Failed to fetch featured articles");
  return res.json();
}

export async function fetchRecentArticles(limit = 4): Promise<Article[]> {
  const url = `${API_ROUTES.RECENT_ARTICLES}?limit=${limit}`;
  let res = await fetch(url, {
    headers: {
      "Cache-Control": "no-cache",
      "Pragma": "no-cache"
    }
  });
  
  // If we get a 304, try again with cache busting
  if (res.status === 304) {
    console.log('304 response for recent articles, fetching fresh data');
    res = await handleCachedResponse(url);
  }
  
  if (!isResponseValid(res)) throw new Error("Failed to fetch recent articles");
  return res.json();
}

export async function fetchArticles(
  page = 1, 
  search?: string
): Promise<{ articles: Article[], total: number }> {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  const url = `${API_ROUTES.ARTICLES}?page=${page}&limit=${ITEMS_PER_PAGE}${searchParam}`;
  
  let res = await fetch(url, {
    headers: {
      "Cache-Control": "no-cache",
      "Pragma": "no-cache"
    }
  });
  
  // If we get a 304, try again with cache busting
  if (res.status === 304) {
    console.log('304 response for articles list, fetching fresh data');
    res = await handleCachedResponse(url);
  }
  
  if (!isResponseValid(res)) throw new Error("Failed to fetch articles");
  return res.json();
}

export async function fetchArticleById(id: string): Promise<Article> {
  const url = API_ROUTES.ARTICLE_BY_ID(id);
  let res = await fetch(url, {
    headers: {
      "Cache-Control": "no-cache",
      "Pragma": "no-cache"
    }
  });
  
  // If we get a 304, try again with cache busting
  if (res.status === 304) {
    console.log(`304 response for article ${id}, fetching fresh data`);
    res = await handleCachedResponse(url);
  }
  
  if (!isResponseValid(res)) throw new Error(`Failed to fetch article with id ${id}`);
  return res.json();
}

export async function fetchTeamMembers(): Promise<Team[]> {
  const url = API_ROUTES.TEAM;
  let res = await fetch(url, {
    headers: {
      "Cache-Control": "no-cache",
      "Pragma": "no-cache"
    }
  });
  
  // If we get a 304, try again with cache busting
  if (res.status === 304) {
    console.log('304 response for team members, fetching fresh data');
    res = await handleCachedResponse(url);
  }
  
  if (!isResponseValid(res)) throw new Error("Failed to fetch team members");
  return res.json();
}

export async function fetchTeamMemberById(id: string): Promise<Team> {
  const url = API_ROUTES.TEAM_MEMBER_BY_ID(id);
  let res = await fetch(url, {
    headers: {
      "Cache-Control": "no-cache",
      "Pragma": "no-cache"
    }
  });
  
  // If we get a 304, try again with cache busting
  if (res.status === 304) {
    console.log(`304 response for team member ${id}, fetching fresh data`);
    res = await handleCachedResponse(url);
  }
  
  if (!isResponseValid(res)) throw new Error(`Failed to fetch team member with id ${id}`);
  return res.json();
}

export async function fetchQuotes(): Promise<CarouselQuote[]> {
  const url = API_ROUTES.QUOTES;
  let res = await fetch(url, {
    headers: {
      "Cache-Control": "no-cache",
      "Pragma": "no-cache"
    }
  });
  
  // If we get a 304, try again with cache busting
  if (res.status === 304) {
    console.log('304 response for quotes, fetching fresh data');
    res = await handleCachedResponse(url);
  }
  
  if (!isResponseValid(res)) throw new Error("Failed to fetch quotes");
  return res.json();
}

export async function fetchQuoteOfDay(): Promise<CarouselQuote> {
  const url = API_ROUTES.QUOTE_OF_DAY;
  let res = await fetch(url, {
    headers: {
      "Cache-Control": "no-cache",
      "Pragma": "no-cache"
    }
  });
  
  // If we get a 304, try again with cache busting
  if (res.status === 304) {
    console.log('304 response for quote of day, fetching fresh data');
    res = await handleCachedResponse(url);
  }
  
  if (!isResponseValid(res)) throw new Error("Failed to fetch quote of the day");
  return res.json();
}
