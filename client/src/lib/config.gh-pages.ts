// GitHub Pages specific configuration
export const BASE_PATH = '/PinkyToeWebsite';

export const getAssetPath = (path: string) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${BASE_PATH}/${cleanPath}`;
};