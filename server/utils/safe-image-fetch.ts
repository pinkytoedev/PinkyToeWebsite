import fetch, { Response } from 'node-fetch';

/**
 * Guarded outbound fetching for the image proxy.
 *
 * The proxy takes a caller-supplied URL, so without these guards an anonymous
 * request can make the server fetch arbitrary internal addresses (cloud
 * metadata endpoints, localhost admin ports, private ranges) and can stream an
 * unbounded body into memory and onto disk.
 */

/** Hosts the proxy is permitted to fetch from. */
const DEFAULT_ALLOWED_HOSTS = [
  'i.ibb.co',
  'ibb.co',
  'i.imgur.com',
  'imgur.com',
  'dl.airtable.com',
  'v5.airtableusercontent.com',
];

/** Cap on a proxied image body. Anything larger is refused. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

/** How long to wait on a single upstream image fetch. */
const FETCH_TIMEOUT_MS = 10_000;

/** Redirects to follow. Enough for CDN shuffling, not enough to be a hop chain. */
const MAX_REDIRECTS = 2;

export class ImageFetchError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'ImageFetchError';
  }
}

/**
 * Hosts allowed for proxying. `IMAGE_HOST_ALLOWLIST` (comma-separated) replaces
 * the defaults so a deployment can point at a different CDN without a release.
 */
export function getAllowedHosts(): string[] {
  const configured = process.env.IMAGE_HOST_ALLOWLIST;
  if (!configured) {
    return DEFAULT_ALLOWED_HOSTS;
  }

  return configured
    .split(',')
    .map(host => host.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Validate a proxy target, returning the normalized URL.
 *
 * Returns null when the URL is unparseable, uses a non-HTTP scheme, or points
 * at a host outside the allowlist. A subdomain only matches when it is a true
 * suffix (`cdn.ibb.co` matches `ibb.co`, `evil-ibb.co` does not).
 */
export function validateImageUrl(rawUrl: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return null;
  }

  // Credentials in a proxy target are never legitimate here.
  if (parsed.username || parsed.password) {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  const allowed = getAllowedHosts().some(
    entry => host === entry || host.endsWith(`.${entry}`)
  );

  return allowed ? parsed : null;
}

/**
 * Fetch an allowlisted image with a timeout, a bounded redirect chain and a
 * hard size cap.
 *
 * Throws ImageFetchError for a blocked or oversized target; returns the
 * response plus its body so callers don't re-read the stream.
 */
export async function fetchImage(
  rawUrl: string
): Promise<{ response: Response; buffer: Buffer; contentType: string }> {
  const url = validateImageUrl(rawUrl);
  if (!url) {
    throw new ImageFetchError(`Blocked image URL: ${rawUrl}`);
  }

  const response = await fetch(url.toString(), {
    redirect: 'follow',
    follow: MAX_REDIRECTS,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { Accept: 'image/*' },
  });

  if (!response.ok) {
    throw new ImageFetchError(
      `Upstream returned ${response.status} for ${url.hostname}`,
      response.status
    );
  }

  // Reject oversized bodies before buffering when the server declares a length.
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) {
    throw new ImageFetchError(
      `Image exceeds ${MAX_IMAGE_BYTES} bytes (declared ${declaredLength})`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    throw new ImageFetchError(`Not an image (content-type: ${contentType || 'none'})`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  // A missing or lying content-length still has to be caught.
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new ImageFetchError(
      `Image exceeds ${MAX_IMAGE_BYTES} bytes (actual ${buffer.byteLength})`
    );
  }

  return { response, buffer, contentType };
}

/** Map an image content-type to the extension we cache it under. */
export function extensionForContentType(contentType: string): string {
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('gif')) return '.gif';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('svg')) return '.svg';
  return '.jpg';
}

/** Map a cached file extension back to the content-type we serve it as. */
export function contentTypeForExtension(ext: string): string {
  switch (ext.toLowerCase()) {
    case '.png': return 'image/png';
    case '.gif': return 'image/gif';
    case '.webp': return 'image/webp';
    case '.svg': return 'image/svg+xml';
    default: return 'image/jpeg';
  }
}
