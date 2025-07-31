import { BASE_PATH } from './constants.gh-pages';

// Helper function to add base path to asset URLs
export function assetUrl(path: string): string {
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) {
    return `${BASE_PATH}${path}`;
  }
  return path;
}