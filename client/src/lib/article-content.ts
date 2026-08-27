import type { Article } from "@shared/schema";

/**
 * Not everything published here is something to read.
 *
 * A good number of posts are a funny picture and a headline — there is no body
 * at all. In a uniform grid they look exactly like a full article, so people
 * open one, find nothing to read, and click straight back out. Knowing which is
 * which lets the list show those as the image they actually are.
 */

/** The subset of an article this module needs; keeps it usable from tests. */
type BodyFields = Pick<Article, "content" | "contentFormat">;

/**
 * Entities that carry no visible text. `&nbsp;` is the one that matters: an
 * editor clearing a rich-text field in Airtable routinely leaves `<p>&nbsp;</p>`
 * behind, which is a 15-character string that renders as nothing.
 */
const BLANK_ENTITIES = /&(nbsp|#160|#xa0|zwnj|#8203);/gi;

/**
 * Whether an article has body text a reader could actually read.
 *
 * Emptiness is decided on what renders, not on string length. An HTML body is
 * stripped to its text first, because `<p></p>`, `<br>` and `<p>&nbsp;</p>` are
 * all non-empty strings that display nothing — and they are what the CMS leaves
 * behind, so testing `content.trim()` alone would call those real articles.
 */
export function hasArticleBody(article: Partial<BodyFields> | undefined): boolean {
  const raw = article?.content;
  if (typeof raw !== "string" || raw.trim() === "") return false;

  // Only HTML needs stripping. Doing it unconditionally would discard a
  // plaintext body that happens to contain angle brackets.
  const text =
    article?.contentFormat === "html"
      ? raw.replace(/<[^>]*>/g, " ").replace(BLANK_ENTITIES, " ")
      : raw;

  return text.replace(/\s/g, "") !== "";
}

/**
 * The inverse, named for what the list is actually deciding.
 *
 * These get a larger, uncropped image and a bigger headline, so the whole point
 * of the post is legible while scrolling rather than one click away.
 */
export function isImageLedArticle(article: Partial<BodyFields> | undefined): boolean {
  return !hasArticleBody(article);
}
