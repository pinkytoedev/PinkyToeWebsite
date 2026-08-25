import { describe, it, expect } from 'vitest';
import { ImageService } from '@server/services/image-service';

/**
 * Articles store the proxy path, not the origin URL, because
 * mapAirtableRecordToArticle sets imageUrl to ImageService.getProxyUrl(...).
 * The pre-cache pipeline is handed those values, so it has to be able to get
 * back to the origin - it previously bailed on anything not starting with
 * "http" and therefore never cached a single image.
 */
describe('ImageService.toOriginUrl', () => {
  it('recovers the origin from a proxy path', () => {
    const origin = 'https://i.ibb.co/abc/Some-Image-WEB-jpg.jpg';

    expect(ImageService.toOriginUrl(ImageService.getProxyUrl(origin))).toBe(origin);
  });

  it('round-trips a URL containing characters that need encoding', () => {
    const origin = "https://i.ibb.co/x/It's a Title (Final) & More.png";

    expect(ImageService.toOriginUrl(ImageService.getProxyUrl(origin))).toBe(origin);
  });

  it('passes a bare origin URL through unchanged', () => {
    const origin = 'https://i.ibb.co/abc/pic.jpg';

    expect(ImageService.toOriginUrl(origin)).toBe(origin);
  });

  it('returns null for things that are not fetchable origins', () => {
    // Airtable record ids and local asset paths are served another way.
    expect(ImageService.toOriginUrl('recAbc123')).toBeNull();
    expect(ImageService.toOriginUrl('/api/images/recAbc123')).toBeNull();
    expect(ImageService.toOriginUrl('/member-photos/Someone.jpg')).toBeNull();
    expect(ImageService.toOriginUrl('')).toBeNull();
  });

  it('getProxyUrl leaves an already-proxied path alone', () => {
    const proxied = '/api/images/https%3A%2F%2Fi.ibb.co%2Fabc%2Fpic.jpg';

    expect(ImageService.getProxyUrl(proxied)).toBe(proxied);
  });
});
