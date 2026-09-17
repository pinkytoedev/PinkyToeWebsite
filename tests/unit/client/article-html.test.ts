import { describe, it, expect } from 'vitest';
import { parseDocsClassStyles, prepareArticleHtml } from '@/lib/article-html';

/**
 * Article bodies are Google Docs exports. These tests pin the two things that
 * decide how one reads on the site: the emphasis that used to be lost with the
 * stylesheet, and the blank paragraphs that used to double its length.
 */

/** A cut-down version of what the CMS actually sends. */
const docsExport = (body: string, css = '.c1{font-style:italic}.c5{font-weight:700}') =>
  `<html><head><style type="text/css">${css}</style></head><body>${body}</body></html>`;

describe('parseDocsClassStyles', () => {
  it('reads emphasis off single-class rules', () => {
    const styles = parseDocsClassStyles(
      '<style>.c1{font-style:italic}.c2{font-weight:700}.c3{text-decoration:underline}</style>'
    );

    expect(styles.get('c1')).toMatchObject({ italic: true });
    expect(styles.get('c2')).toMatchObject({ bold: true });
    expect(styles.get('c3')).toMatchObject({ underline: true });
  });

  it('treats the Docs defaults as no emphasis', () => {
    const styles = parseDocsClassStyles(
      '<style>.c0{font-weight:400;font-style:normal;text-decoration:none}</style>'
    );

    expect(styles.get('c0')).toEqual({ bold: false, italic: false, underline: false });
  });

  it('ignores selectors that are not a bare class', () => {
    const styles = parseDocsClassStyles(
      '<style>.c1 .c2{font-style:italic} li.c3{font-weight:700} #x{font-weight:700}</style>'
    );

    expect(styles.size).toBe(0);
  });

  it('keeps centring but drops justification', () => {
    // Justified text on a phone-width column opens rivers of whitespace,
    // because browsers justify without hyphenating.
    const styles = parseDocsClassStyles(
      '<style>.c4{text-align:center}.c7{text-align:justify}</style>'
    );

    expect(styles.get('c4')).toEqual({ align: 'center' });
    expect(styles.get('c7')).toBeUndefined();
  });

  it('lets a later rule win, the way the cascade would', () => {
    const styles = parseDocsClassStyles(
      '<style>.c1{font-style:italic}.c1{font-style:normal}</style>'
    );

    expect(styles.get('c1')).toMatchObject({ italic: false });
  });

  it('survives an article with no stylesheet at all', () => {
    expect(parseDocsClassStyles('<p>plain</p>').size).toBe(0);
    expect(parseDocsClassStyles('').size).toBe(0);
  });
});

describe('prepareArticleHtml', () => {
  it('restores emphasis the stylesheet used to carry', () => {
    // Without this every italicised film title in the archive renders flat,
    // because sanitization removes the <style> block that defined .c1.
    const out = prepareArticleHtml(
      docsExport('<p class="c7"><span class="c1">Challengers</span></p>')
    );

    expect(out).toContain('<em>Challengers</em>');
  });

  it('does not repeat emphasis an ancestor already applies', () => {
    const out = prepareArticleHtml(
      docsExport('<p class="c5"><span class="c5">loud</span></p>', '.c5{font-weight:700}')
    );

    expect(out.match(/<strong>/g)).toHaveLength(1);
  });

  it('removes the blank paragraphs Docs writes instead of margins', () => {
    const out = prepareArticleHtml(
      docsExport('<p class="c7">Real.</p><p class="c4"><span class="c0">&nbsp;</span></p><p class="c7">Also real.</p>')
    );

    expect(out.match(/<p/g)).toHaveLength(2);
    expect(out).toContain('Real.');
    expect(out).toContain('Also real.');
  });

  it('keeps a paragraph that only holds an image', () => {
    const out = prepareArticleHtml('<p><img src="https://example.test/a.png"></p>');

    expect(out).toContain('<img');
    expect(out).toContain('<p>');
  });

  it('keeps a <br> that separates real text', () => {
    const out = prepareArticleHtml('<p>one<br>two</p>');

    expect(out).toContain('one<br>two');
  });

  it('collapses a run of <br> used as a paragraph break', () => {
    const out = prepareArticleHtml('<p>one<br><br><br>two</p>');

    expect(out.match(/<br>/g)).toHaveLength(1);
  });

  it('points Docs redirect links at their real destination', () => {
    const href =
      'https://www.google.com/url?q=https://www.bunionpaper.com/featured-news/x&amp;sa=D&amp;usg=AOv';
    const out = prepareArticleHtml(`<p><a href="${href}">link</a></p>`);

    expect(out).toContain('href="https://www.bunionpaper.com/featured-news/x"');
    expect(out).not.toContain('google.com/url');
  });

  it('will not unwrap a redirect into a non-http destination', () => {
    // The wrapper itself is an inert https URL; promoting whatever sits in its
    // `q` to the href is what would have to be guarded, so it is.
    const out = prepareArticleHtml('<p><a href="https://www.google.com/url?q=javascript:alert(1)">x</a></p>');

    expect(out).toContain('href="https://www.google.com/url?q=javascript:alert(1)"');
    expect(out).not.toContain('href="javascript:');
  });

  it('strips the dead Docs classes', () => {
    // The stylesheet that gave them meaning is gone, and `.c1` is a name the
    // site's own CSS could just as easily want.
    const out = prepareArticleHtml(docsExport('<p class="c7"><span class="c3">text</span></p>'));

    expect(out).not.toContain('class=');
  });

  it('moves image dimensions off inline styles so the page does not jump', () => {
    const out = prepareArticleHtml('<p><img src="https://example.test/a.png" style="width:624px;height:351px"></p>');

    expect(out).toContain('width="624"');
    expect(out).toContain('height="351"');
    expect(out).toContain('loading="lazy"');
    expect(out).not.toContain('style=');
  });

  it('keeps centring that the stylesheet asked for', () => {
    const out = prepareArticleHtml(
      docsExport('<p class="c4">centred</p>', '.c4{text-align:center}')
    );

    expect(out).toContain('text-align: center');
  });

  it('still refuses anything dangerous', () => {
    const out = prepareArticleHtml(
      '<p onclick="alert(1)">hi</p><script>alert(2)</script><img src=x onerror="alert(3)">'
    );

    expect(out).not.toContain('<script');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('onerror');
  });

  it('returns an empty string for an empty body', () => {
    expect(prepareArticleHtml('')).toBe('');
    expect(prepareArticleHtml(null)).toBe('');
    expect(prepareArticleHtml(undefined)).toBe('');
  });
});
