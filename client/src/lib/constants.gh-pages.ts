export const SITE_NAME = "The Pinky Toe";
export const SITE_TAGLINE = "Feminist Humor, Right at Your Feet";

// Base path for GitHub Pages
export const BASE_PATH = '/PinkyToeWebsite';

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
  ARTICLE_BY_ID: (id: string) => `/api/articles/${id}`,
  TEAM: "/api/team",
  TEAM_MEMBER_BY_ID: (id: string) => `/api/team/${id}`,
  QUOTES: "/api/quotes",
  QUOTE_OF_DAY: "/api/quotes/daily",
};

export const ITEMS_PER_PAGE = 6;

export const SOCIAL_LINKS = {
  INSTAGRAM: "https://instagram.com/pinkytoepaper",
};

// Asset paths with base path
export const ASSETS = {
  LOGO: `${BASE_PATH}/attached_assets/TransparentLogo.png`,
  WORD_LOGO: `${BASE_PATH}/attached_assets/TransparentWordLogo.png`,
  BACKGROUND_PATTERN: `${BASE_PATH}/attached_assets/background for pinky website.png`,
  FAVICON: `${BASE_PATH}/attached_assets/pinkyfavicon.ico`,
};