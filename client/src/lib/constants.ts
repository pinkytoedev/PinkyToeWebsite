export const SITE_NAME = "The Pinky Toe";
export const SITE_TAGLINE = "Feminist Humor, Right at Your Feet";

export const ROUTES = {
  HOME: "/",
  ARTICLES: "/articles",
  ARTICLE_DETAIL: "/articles/:id",
  TEAM: "/team",
  TEAM_MEMBER: "/team/:id",
  PRIVACY_POLICY: "/privacy-policy",
};

export const API_ROUTES = {
  ARTICLES: "/api/articles",
  FEATURED_ARTICLES: "/api/articles/featured",
  RECENT_ARTICLES: "/api/articles/recent",
  ARTICLE_BY_ID: (id: string) => `/api/articles/${id}`,
  TEAM: "/api/team",
  TEAM_MEMBER_BY_ID: (id: string) => `/api/team/${id}`,
  ARTICLES_BY_TEAM_MEMBER: (id: string) => `/api/team/${id}/articles`,
  QUOTES: "/api/quotes",
  QUOTE_OF_DAY: "/api/quotes/daily",
};

export const ITEMS_PER_PAGE = 6;

export const SOCIAL_LINKS = {
  INSTAGRAM: "https://instagram.com/pinkytoepaper",
};

export const PLACEHOLDER_IMAGE = '/api/images/placeholder';
