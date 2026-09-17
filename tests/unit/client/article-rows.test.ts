import { describe, it, expect } from 'vitest';
import { balanceRowSizes, buildArticleRows, type ArticleRow } from '@/lib/article-rows';

/**
 * A page is six articles. The bug this replaces: one body-less post took a
 * full-width row, leaving five cards to fill a three-column grid, so the page
 * ended on a row of two with a third of it visibly empty.
 */

let nextId = 0;
const card = () => ({ id: `card-${nextId++}`, content: 'Some real body text.', contentFormat: 'plaintext' }) as any;
const poster = () => ({ id: `poster-${nextId++}`, content: '', contentFormat: 'plaintext' }) as any;

const shape = (rows: ArticleRow[]) =>
  rows.map(row => (row.kind === 'poster' ? 'poster' : row.articles.length));

describe('balanceRowSizes', () => {
  it('fills whole rows when the count divides evenly', () => {
    expect(balanceRowSizes(6, 3)).toEqual([3, 3]);
    expect(balanceRowSizes(3, 3)).toEqual([3]);
  });

  it('spreads the remainder instead of stranding one card', () => {
    // Four cards go 2 + 2, never 3 + 1: a row holding a single normal-width
    // card beside empty space is the thing being designed out.
    expect(balanceRowSizes(4, 3)).toEqual([2, 2]);
    expect(balanceRowSizes(5, 3)).toEqual([3, 2]);
    expect(balanceRowSizes(7, 3)).toEqual([3, 2, 2]);
  });

  it('balances two-column rows the same way', () => {
    expect(balanceRowSizes(3, 2)).toEqual([2, 1]);
    expect(balanceRowSizes(4, 2)).toEqual([2, 2]);
    expect(balanceRowSizes(5, 2)).toEqual([2, 2, 1]);
  });

  it('gives every card its own row on a phone', () => {
    expect(balanceRowSizes(4, 1)).toEqual([1, 1, 1, 1]);
  });

  it('handles nothing to lay out', () => {
    expect(balanceRowSizes(0, 3)).toEqual([]);
  });
});

describe('buildArticleRows', () => {
  it('lays a page of ordinary articles out three across', () => {
    expect(shape(buildArticleRows([card(), card(), card(), card(), card(), card()], 3)))
      .toEqual([3, 3]);
  });

  it('leaves no short tail when one post is image-led', () => {
    // The reported case: six articles, one of them a picture.
    const rows = buildArticleRows([card(), card(), card(), poster(), card(), card()], 3);

    expect(shape(rows)).toEqual([3, 'poster', 2]);
  });

  it('pairs the leftovers rather than stranding one', () => {
    const rows = buildArticleRows([poster(), poster(), card(), card(), card(), card()], 3);

    expect(shape(rows)).toEqual(['poster', 'poster', 2, 2]);
  });

  it('keeps a part-filled run above the post that interrupted it', () => {
    const rows = buildArticleRows([card(), card(), poster(), card(), card(), card()], 3);

    expect(shape(rows)).toEqual([2, 'poster', 3]);
  });

  it('lets a single card slip below a picture rather than sit in a row alone', () => {
    // The one place date order gives way: a lone card above the poster would
    // be a row holding one card, which is the shape being designed out.
    const rows = buildArticleRows([card(), poster(), card(), card(), card(), card()], 3);

    expect(shape(rows)).toEqual(['poster', 3, 2]);
  });

  it('pairs four cards that run up against a picture', () => {
    // Laid down greedily these would be 3 + 1.
    const rows = buildArticleRows([card(), card(), card(), card(), poster(), poster()], 3);

    expect(shape(rows)).toEqual([2, 2, 'poster', 'poster']);
  });

  it('keeps date order intact on a phone, where rows hold one card anyway', () => {
    const page = [card(), poster(), card(), card()];
    const rows = buildArticleRows(page, 1);

    expect(shape(rows)).toEqual([1, 'poster', 1, 1]);
  });

  it('handles a page that is all pictures', () => {
    const rows = buildArticleRows([poster(), poster(), poster()], 3);

    expect(shape(rows)).toEqual(['poster', 'poster', 'poster']);
  });

  it('never leaves a card alone, whichever of six articles are pictures', () => {
    // Three columns is the case this has to hold for: six articles minus any
    // number of pictures always splits without a remainder of one. Two columns
    // cannot promise it - five cards are 2 + 2 + 1 however they are arranged -
    // so the grid caps a leftover card to one column's width instead.
    for (let posters = 0; posters <= 4; posters++) {
      const page = [
        ...Array.from({ length: posters }, poster),
        ...Array.from({ length: 6 - posters }, card),
      ];

      for (const row of buildArticleRows(page, 3)) {
        if (row.kind === 'cards') expect(row.articles.length).toBeGreaterThan(1);
      }
    }
  });

  it('keeps every article exactly once, and never overfills a row', () => {
    const page = [card(), poster(), card(), card(), poster(), card()];

    for (const columns of [1, 2, 3]) {
      const rows = buildArticleRows(page, columns);
      const laidOut = rows.flatMap(row => (row.kind === 'poster' ? [row.article] : row.articles));

      expect(laidOut.map(a => a.id).sort()).toEqual(page.map(a => a.id).sort());

      for (const row of rows) {
        if (row.kind === 'cards') {
          expect(row.articles.length).toBeGreaterThan(0);
          expect(row.articles.length).toBeLessThanOrEqual(columns);
        }
      }
    }
  });

  it('treats html that renders to nothing as a picture post', () => {
    const blank = { id: 'blank', content: '<p>&nbsp;</p>', contentFormat: 'html' } as any;

    expect(shape(buildArticleRows([blank], 3))).toEqual(['poster']);
  });

  it('copes with an empty page', () => {
    expect(buildArticleRows([], 3)).toEqual([]);
  });
});
