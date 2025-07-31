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

export const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmFjOGQyIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iI0ZGNEQ4RCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=';