import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateImageUrl,
  extensionForContentType,
  contentTypeForExtension,
  getFetchTimeoutMs,
} from '@server/utils/safe-image-fetch';

/**
 * The image proxy fetches a caller-supplied URL. Before the allowlist existed,
 * an anonymous request could make the server reach cloud metadata endpoints,
 * localhost admin ports and arbitrary internal hosts.
 */
describe('validateImageUrl', () => {
  const originalAllowlist = process.env.IMAGE_HOST_ALLOWLIST;

  afterEach(() => {
    if (originalAllowlist === undefined) {
      delete process.env.IMAGE_HOST_ALLOWLIST;
    } else {
      process.env.IMAGE_HOST_ALLOWLIST = originalAllowlist;
    }
  });

  it('allows the image hosts the site actually uses', () => {
    expect(validateImageUrl('https://i.ibb.co/abc/pic.jpg')).not.toBeNull();
    expect(validateImageUrl('https://i.imgur.com/abc.png')).not.toBeNull();
    expect(validateImageUrl('https://v5.airtableusercontent.com/x')).not.toBeNull();
  });

  it('allows subdomains of an allowlisted host', () => {
    expect(validateImageUrl('https://cdn.ibb.co/pic.jpg')).not.toBeNull();
  });

  it('rejects a lookalike host that merely ends with the allowlisted string', () => {
    expect(validateImageUrl('https://evil-ibb.co/pic.jpg')).toBeNull();
    expect(validateImageUrl('https://ibb.co.attacker.test/pic.jpg')).toBeNull();
  });

  it('blocks SSRF targets', () => {
    expect(validateImageUrl('http://169.254.169.254/latest/meta-data/')).toBeNull();
    expect(validateImageUrl('http://localhost:5000/api/admin/refresh')).toBeNull();
    expect(validateImageUrl('http://127.0.0.1/')).toBeNull();
    expect(validateImageUrl('http://10.0.0.1/')).toBeNull();
  });

  it('blocks non-HTTP schemes', () => {
    expect(validateImageUrl('file:///etc/passwd')).toBeNull();
    expect(validateImageUrl('gopher://i.ibb.co/')).toBeNull();
    expect(validateImageUrl('javascript:alert(1)')).toBeNull();
  });

  it('rejects embedded credentials', () => {
    expect(validateImageUrl('https://user:pass@i.ibb.co/pic.jpg')).toBeNull();
  });

  it('rejects unparseable input', () => {
    expect(validateImageUrl('not a url')).toBeNull();
    expect(validateImageUrl('')).toBeNull();
  });

  it('honours an operator-supplied allowlist', () => {
    process.env.IMAGE_HOST_ALLOWLIST = 'images.example.test';

    expect(validateImageUrl('https://images.example.test/a.jpg')).not.toBeNull();
    expect(validateImageUrl('https://i.ibb.co/a.jpg')).toBeNull();
  });
});

describe('getFetchTimeoutMs', () => {
  const KEYS = ['IMAGE_FETCH_TIMEOUT_MS', 'IMAGE_BACKGROUND_FETCH_TIMEOUT_MS'] as const;
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of KEYS) { saved[k] = process.env[k]; delete process.env[k]; }
  });

  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k]!;
    }
  });

  it('gives background work a far longer budget than a waiting browser', () => {
    // The regression: one tight budget for both. The CDN serves cold objects
    // at ~30-60 KB/s, so a multi-megabyte image cannot finish inside a
    // browser-friendly window - and a foreground timeout cached nothing, so
    // the image stayed broken on every later load too. Background fetches have
    // to be patient enough to actually get the file onto disk.
    expect(getFetchTimeoutMs(true)).toBeGreaterThan(getFetchTimeoutMs(false));
  });

  it('keeps the foreground budget short enough for a page load', () => {
    expect(getFetchTimeoutMs(false)).toBeLessThanOrEqual(30_000);
  });

  it('is patient enough in the background for a large slow file', () => {
    // 4 MB at the observed ~60 KB/s is a bit over a minute.
    expect(getFetchTimeoutMs(true)).toBeGreaterThanOrEqual(120_000);
  });

  it('honours env overrides', () => {
    process.env.IMAGE_FETCH_TIMEOUT_MS = '1234';
    process.env.IMAGE_BACKGROUND_FETCH_TIMEOUT_MS = '5678';

    expect(getFetchTimeoutMs(false)).toBe(1234);
    expect(getFetchTimeoutMs(true)).toBe(5678);
  });

  it('ignores junk overrides and falls back to the defaults', () => {
    for (const bad of ['', 'soon', '0', '-5']) {
      process.env.IMAGE_FETCH_TIMEOUT_MS = bad;
      expect(getFetchTimeoutMs(false)).toBe(20_000);
    }
  });
});

describe('content type mapping', () => {
  it('round-trips the formats we cache', () => {
    for (const [contentType, ext] of [
      ['image/png', '.png'],
      ['image/gif', '.gif'],
      ['image/webp', '.webp'],
      ['image/svg+xml', '.svg'],
    ] as const) {
      expect(extensionForContentType(contentType)).toBe(ext);
      expect(contentTypeForExtension(ext)).toBe(contentType);
    }
  });

  it('maps rate-limited SVG placeholders correctly', () => {
    // Regression: .svg fell through to image/jpeg, so every cached
    // "<hash>_ratelimited.svg" was served as a broken JPEG.
    expect(contentTypeForExtension('.svg')).toBe('image/svg+xml');
  });

  it('defaults unknown types to jpeg', () => {
    expect(extensionForContentType('image/jpeg')).toBe('.jpg');
    expect(contentTypeForExtension('.jpg')).toBe('image/jpeg');
    expect(contentTypeForExtension('.bin')).toBe('image/jpeg');
  });
});
