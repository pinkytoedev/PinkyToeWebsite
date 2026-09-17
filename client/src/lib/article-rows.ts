import type { Article } from "@shared/schema";
import { isImageLedArticle } from "./article-content";

/**
 * Arrange a page of articles into rows that always come out full.
 *
 * A page is a fixed six articles, and a post with no body needs the full width
 * to be worth showing at all. Those two facts do not fit a uniform three-up
 * grid: one full-width post plus five cards is eight columns of content in a
 * grid that only completes at multiples of three, so the page ended on a row
 * of two with a third of it empty - a hole that reads as a layout that broke
 * rather than one that was designed.
 *
 * Dense auto-flow does not solve it either. It backfills gaps *inside* the
 * grid, but nothing can fill the tail, and it reorders more aggressively than
 * this does.
 *
 * So rows are built explicitly instead of left to the grid, and a row is sized
 * to what it holds: three cards across, or two across if that is what is left.
 * A short row of equal, wider cards looks deliberate; a short row of
 * normal-width cards with a gap beside them does not.
 */

export type ArticleRow =
  | { kind: "poster"; article: Article }
  | { kind: "cards"; articles: Article[] };

/**
 * How to split `count` cards into rows of at most `columns`, as evenly as the
 * count allows.
 *
 * Evenly, not greedily: four cards in a three-column grid go two and two, not
 * three and one. A lone card on its own row is the shape this whole module
 * exists to avoid, and 2 + 2 is the only split of four that has none.
 */
export function balanceRowSizes(count: number, columns: number): number[] {
  if (count <= 0) return [];
  if (columns <= 1) return Array(count).fill(1);

  const rows = Math.ceil(count / columns);
  const base = Math.floor(count / rows);
  const remainder = count % rows;

  return Array.from({ length: rows }, (_, i) => (i < remainder ? base + 1 : base));
}

/**
 * Turn a page of articles into poster rows and card rows.
 *
 * Cards are held back until something ends their run - a post with no body, or
 * the end of the page - and only then split into rows. Waiting is what makes
 * the split even: laying rows down greedily as cards arrive fills the first
 * row with three and leaves whatever follows to fend for itself, which is how
 * four cards become 3 + 1 instead of 2 + 2.
 *
 * Date order survives this, with one exception noted below.
 */
export function buildArticleRows(articles: Article[], columns: number): ArticleRow[] {
  const rows: ArticleRow[] = [];
  let pending: Article[] = [];

  const flush = () => {
    for (const size of balanceRowSizes(pending.length, columns)) {
      rows.push({ kind: "cards", articles: pending.slice(0, size) });
      pending = pending.slice(size);
    }
  };

  for (const article of articles) {
    if (!isImageLedArticle(article)) {
      pending.push(article);
      continue;
    }

    // One card flushed here would be a row holding a single card. It is worth
    // one article slipping below the picture to avoid that; on a phone every
    // row holds one card anyway, so there is nothing to avoid.
    if (pending.length !== 1 || columns === 1) flush();

    rows.push({ kind: "poster", article });
  }

  flush();

  return rows;
}
