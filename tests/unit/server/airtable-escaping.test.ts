import { describe, it, expect } from 'vitest';
import { escapeAirtableString } from '@server/storage';

/**
 * Search terms are interpolated into an Airtable formula string literal.
 * The old escaping handled `"` but not `\`, so a trailing backslash escaped
 * the closing quote and let the caller continue the formula - which could
 * defeat the `Finished = TRUE()` guard that hides unpublished drafts.
 */
describe('escapeAirtableString', () => {
  it('escapes the backslash before the quote', () => {
    // If `\` were escaped second, the output would end `\\"` and break out.
    expect(escapeAirtableString('a\\')).toBe('a\\\\');
  });

  it('neutralises a formula break-out attempt', () => {
    const escaped = escapeAirtableString('a\\", {Finished}) , OR(TRUE(');
    const formula = `SEARCH("${escaped}", {Name})`;

    // The injected quote must stay escaped, leaving exactly two unescaped
    // quotes in the formula: the ones we wrote.
    const unescapedQuotes = formula.replace(/\\\\/g, '').match(/(?<!\\)"/g) ?? [];
    expect(unescapedQuotes).toHaveLength(2);
  });

  it('escapes double quotes by default', () => {
    expect(escapeAirtableString('say "hi"')).toBe('say \\"hi\\"');
  });

  it('escapes single quotes when targeting a single-quoted literal', () => {
    expect(escapeAirtableString("O'Brien", "'")).toBe("O\\'Brien");
  });

  it('leaves the other quote style alone', () => {
    // A double quote inside a single-quoted literal needs no escaping, and
    // escaping it would change what the formula matches.
    expect(escapeAirtableString('say "hi"', "'")).toBe('say "hi"');
  });

  it('strips control characters', () => {
    expect(escapeAirtableString('a\x00b\x1Fc\x7Fd')).toBe('abcd');
  });

  it('caps the length of the search term', () => {
    expect(escapeAirtableString('x'.repeat(500))).toHaveLength(100);
  });

  it('passes ordinary search terms through unchanged', () => {
    expect(escapeAirtableString('brandy melville')).toBe('brandy melville');
  });
});
