import { describe, it, expect } from 'vitest';
import { deriveDescriptionFromContent } from '../../../server/utils/article-description';

/**
 * The stand-in description shown under a headline when the CMS field is empty.
 * Extracted from the Airtable mapper unchanged; these pin the behaviour that
 * was already relied on, plus the emptiness that tells the article page to
 * stay silent.
 */
describe('deriveDescriptionFromContent', () => {
  it('takes the first two sentences of plain text', () => {
    const out = deriveDescriptionFromContent('One. Two. Three. Four.', 'plaintext');

    expect(out).toBe('One. Two.');
  });

  it('keeps question and exclamation marks as sentence ends', () => {
    expect(deriveDescriptionFromContent('Really? Yes! No.', 'plaintext')).toBe('Really? Yes!');
  });

  it('strips html down to the words', () => {
    const out = deriveDescriptionFromContent('<p><span>First sentence.</span></p><p>Second one.</p>', 'html');

    expect(out).toBe('First sentence. Second one.');
    expect(out).not.toContain('<');
  });

  it('keeps a word boundary between blocks', () => {
    // Without this the last word of a paragraph runs into the first of the
    // next: "endingbeginning".
    const out = deriveDescriptionFromContent('<p>ending</p><p>beginning</p>', 'html');

    expect(out).toContain('ending beginning');
  });

  it('throws away the Google Docs stylesheet rather than reading it as prose', () => {
    const out = deriveDescriptionFromContent(
      '<html><head><style>.c1{font-style:italic}</style></head><body><p>Real text.</p></body></html>',
      'html',
    );

    expect(out).toBe('Real text.');
    expect(out).not.toContain('font-style');
  });

  it('decodes the entities Airtable bodies carry', () => {
    const out = deriveDescriptionFromContent('<p>It&rsquo;s fine &amp; good.</p>', 'html');

    expect(out).toBe("It's fine & good.");
  });

  it('falls back to a truncated run of text when nothing ends a sentence', () => {
    const long = 'word '.repeat(60).trim();
    const out = deriveDescriptionFromContent(long, 'plaintext');

    expect(out.endsWith('...')).toBe(true);
    expect(out.length).toBe(203);
  });

  it('returns short text unchanged when it has no sentence ending', () => {
    expect(deriveDescriptionFromContent('no full stop here', 'plaintext')).toBe('no full stop here');
  });

  it('has nothing to say about a post with no body', () => {
    // This is what leaves a picture post with no description at all.
    expect(deriveDescriptionFromContent('', 'html')).toBe('');
    expect(deriveDescriptionFromContent('', 'plaintext')).toBe('');
  });
});
