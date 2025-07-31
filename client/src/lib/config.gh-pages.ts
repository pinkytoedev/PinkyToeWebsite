// GitHub Pages specific configuration for custom domain
export const BASE_PATH = '';

export const getAssetPath = (path: string) => {
  // For custom domain, use root path
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return cleanPath;
};