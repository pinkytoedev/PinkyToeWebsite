import { describe, it, expect } from 'vitest';
import { sanitizeArticleHtml } from '@/lib/sanitize';

/**
 * Article bodies are Airtable-authored HTML rendered via
 * dangerouslySetInnerHTML, so anything that survives sanitization runs in
 * every reader's browser.
 */
describe('sanitizeArticleHtml', () => {
  it('strips script tags', () => {
    const out = sanitizeArticleHtml('<p>hi</p><script>alert(1)</script>');

    expect(out).toContain('<p>hi</p>');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
  });

  it('strips inline event handlers', () => {
    const out = sanitizeArticleHtml('<img src="x" onerror="alert(1)">');

    expect(out).not.toContain('onerror');
  });

  it('strips javascript: URLs', () => {
    const out = sanitizeArticleHtml('<a href="javascript:alert(1)">click</a>');

    expect(out).not.toContain('javascript:');
  });

  it('strips the Google Docs <style> wrapper', () => {
    // Article bodies arrive as full Google Docs documents. Injecting their
    // <style> block applies its rules to the entire page, not just the
    // article, so the wrapper has to go.
    const out = sanitizeArticleHtml(
      '<html><head><style>.c1{color:red}</style></head><body><p>text</p></body></html>'
    );

    expect(out).not.toContain('<style');
    expect(out).not.toContain('color:red');
    expect(out).toContain('text');
  });

  it('keeps the formatting editors actually use', () => {
    const html = '<p><strong>bold</strong> <em>italic</em></p><ul><li>one</li></ul><h2>head</h2>';
    const out = sanitizeArticleHtml(html);

    for (const tag of ['<strong>', '<em>', '<ul>', '<li>', '<h2>']) {
      expect(out).toContain(tag);
    }
  });

  it('keeps images and links', () => {
    const out = sanitizeArticleHtml('<a href="https://example.com">x</a><img src="https://example.com/a.png">');

    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('<img');
  });

  it('forces external links to open safely', () => {
    const out = sanitizeArticleHtml('<a href="https://example.com">x</a>');

    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('target="_blank"');
  });

  it('handles empty input', () => {
    expect(sanitizeArticleHtml('')).toBe('');
    expect(sanitizeArticleHtml(null)).toBe('');
    expect(sanitizeArticleHtml(undefined)).toBe('');
  });
});
