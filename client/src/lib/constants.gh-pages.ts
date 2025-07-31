export const SITE_NAME = "The Pinky Toe";
export const SITE_TAGLINE = "Feminist Humor, Right at Your Feet";

export const ROUTES = {
  HOME: "/",
  ARTICLES: "/articles",
  ARTICLE_DETAIL: "/articles/:id",
  TEAM: "/team",
  TEAM_MEMBER: "/team/:id",
};

// These are not used in GitHub Pages since we read from static files directly
export const API_ROUTES = {
  ARTICLES: "/PinkyToeWebsite/data/articles.json",
  FEATURED_ARTICLES: "/PinkyToeWebsite/data/featured-articles.json",
  RECENT_ARTICLES: "/PinkyToeWebsite/data/recent-articles.json",
  ARTICLE_BY_ID: (id: string) => `/PinkyToeWebsite/data/articles.json`,
  TEAM: "/PinkyToeWebsite/data/team.json",
  TEAM_MEMBER_BY_ID: (id: string) => `/PinkyToeWebsite/data/team.json`,
  QUOTES: "/PinkyToeWebsite/data/quotes.json",
  QUOTE_OF_DAY: "/PinkyToeWebsite/data/quotes.json",
};

export const ITEMS_PER_PAGE = 6;

export const SOCIAL_LINKS = {
  INSTAGRAM: "https://instagram.com/pinkytoepaper",
};