export const SITE_NAME = "The Pinky Toe";
export const SITE_TAGLINE = "Feminist Humor, Right at Your Feet";

export const ROUTES = {
  HOME: "/",
  ARTICLES: "/articles",
  ARTICLE_DETAIL: "/articles/:id",
  TEAM: "/team",
  TEAM_MEMBER: "/team/:id",
};

export const API_ROUTES = {
  ARTICLES: "/api/articles",
  FEATURED_ARTICLES: "/api/articles/featured",
  RECENT_ARTICLES: "/api/articles/recent",
  ARTICLE_BY_ID: (id: string | undefined) => id ? `/api/articles/${id}` : "/api/articles",
  TEAM: "/api/team",
  TEAM_MEMBER_BY_ID: (id: string | undefined) => id ? `/api/team/${id}` : "/api/team",
  QUOTES: "/api/quotes",
  QUOTE_OF_DAY: "/api/quotes/daily",
};

export const ITEMS_PER_PAGE = 6;

export const SOCIAL_LINKS = {
  INSTAGRAM: "https://instagram.com/pinkytoepaper",
};
