/**
 * Standing in for a description the editor never wrote.
 *
 * Most posts leave Airtable's description field empty, and the article list
 * needs something under each headline, so the opening of the article is used
 * instead. That is a good teaser on a card and a bad one on the article
 * itself, where it sits directly above the very sentences it was cut from and
 * makes the reader read them twice.
 *
 * So the derivation is kept, and callers are told when they are looking at one
 * - see `descriptionIsExcerpt` on the article.
 */

/** The entities Airtable bodies actually contain. */
const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&rsquo;': "'",
  '&lsquo;': "'",
  '&rdquo;': '"',
  '&ldquo;': '"',
  '&mdash;': '—',
  '&ndash;': '–',
};

function decodeHtmlEntities(text: string): string {
  return text.replace(/&[a-zA-Z0-9#]+;/g, match => ENTITIES[match] || match);
}

/** How much plain text to fall back to when nothing looks like a sentence. */
const FALLBACK_LENGTH = 200;

/**
 * The first two sentences of an article body, as plain text.
 *
 * Returns an empty string when there is nothing to take, which is how a
 * picture post with no body ends up with no description at all.
 */
export function deriveDescriptionFromContent(content: string, contentFormat: string): string {
  if (!content) return '';

  let plainText = content;

  if (contentFormat === 'html') {
    // Style and meta blocks first: their contents are not prose, and stripping
    // tags around them would spill CSS into the teaser.
    plainText = plainText.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    plainText = plainText.replace(/<meta[^>]*>/gi, '');

    // A closing block tag is a word boundary; without this the last word of a
    // paragraph runs into the first word of the next.
    plainText = plainText.replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, ' ');
    plainText = plainText.replace(/<[^>]*>/g, '');
    plainText = decodeHtmlEntities(plainText);
    plainText = plainText.replace(/\s+/g, ' ').trim();
  }

  // Sentences ending in . ! or ?
  const sentences = plainText.match(/.*?[.!?](?:\s|$)/g);

  if (sentences && sentences.length > 0) {
    return sentences.slice(0, 2).join('').trim();
  }

  return plainText.length > FALLBACK_LENGTH
    ? plainText.substring(0, FALLBACK_LENGTH) + '...'
    : plainText;
}
