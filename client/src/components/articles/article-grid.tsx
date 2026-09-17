import { useMemo } from "react";
import { Article } from "@shared/schema";
import { useColumnCount } from "@/hooks/use-column-count";
import { buildArticleRows } from "@/lib/article-rows";
import { ArticleCard } from "./article-card";
import { ImageLedArticleRow } from "./image-led-article-row";

interface ArticleGridProps {
  articles: Article[];
  /** Kept for the in-place reader; the card itself also links to the article. */
  onArticleClick?: (articleId: string) => void;
}

/** The gap between cards, in pixels - `gap-6`. */
const GAP = 24;

/**
 * A page of articles, laid out as rows rather than as one wrapping grid.
 *
 * The rules live in `lib/article-rows.ts`; this only draws them. Each row is
 * given exactly as many columns as it has cards, which is what keeps a short
 * row looking like a decision instead of a gap. Column counts come from a
 * media query rather than from CSS, because a row built for three columns
 * would wrap to 2 + 1 on a tablet and put the hole straight back.
 */
export function ArticleGrid({ articles, onArticleClick }: ArticleGridProps) {
  const columns = useColumnCount();
  const rows = useMemo(() => buildArticleRows(articles, columns), [articles, columns]);

  return (
    <div className="mb-8 space-y-6">
      {rows.map(row => {
        if (row.kind === "poster") {
          return (
            <div key={row.article.id} onClick={() => onArticleClick?.(row.article.id)}>
              <ImageLedArticleRow article={row.article} />
            </div>
          );
        }

        const lonely = row.articles.length === 1 && columns > 1;

        return (
          <div
            key={row.articles[0].id}
            className="grid gap-6"
            style={{ gridTemplateColumns: `repeat(${row.articles.length}, minmax(0, 1fr))` }}
          >
            {row.articles.map(article => (
              <div
                key={article.id}
                className="h-full"
                onClick={() => onArticleClick?.(article.id)}
                // One card left over has no row to share, and stretched across
                // the page it stops looking like a card at all. Held to the
                // width it would have had in a full row instead.
                style={lonely ? { maxWidth: `calc((100% - ${(columns - 1) * GAP}px) / ${columns})` } : undefined}
              >
                <ArticleCard article={article} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
