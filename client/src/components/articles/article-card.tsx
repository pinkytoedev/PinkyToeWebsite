import { Link } from "wouter";
import { Article } from "@shared/schema";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/image-helper";

interface ArticleCardProps {
  article: Article;
}

/**
 * One article in the list.
 *
 * This is the card for a post with something to read. A post with no body gets
 * `ImageLedArticleRow` instead - the picture is the whole post there, and it
 * needs a row, not a third of one. `ArticleGrid` decides which is which.
 *
 * The fixed image height and the reserved title and description blocks are
 * what keep cards level with their neighbours in a row.
 */
export function ArticleCard({ article }: ArticleCardProps) {
  // Use imageUrl from MainImageLink or fall back to placeholder
  const imageSource = article.imageUrl ? getImageUrl(article.imageUrl) : PLACEHOLDER_IMAGE;

  return (
    <Link href={`/articles/${article.id}`} className="block h-full">
      <div className="article-card group flex h-full cursor-pointer flex-col overflow-hidden rounded-lg bg-pink-50 shadow-lg transition-shadow hover:shadow-xl">
        <div className="relative">
          <img
            src={imageSource}
            alt={article.title}
            className="h-48 w-full bg-pink-100/50 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src.endsWith(PLACEHOLDER_IMAGE)) return;
              console.error(`Failed to load image: ${target.src}`);
              target.src = PLACEHOLDER_IMAGE;
            }}
          />
          <div className="article-overlay absolute inset-0 flex items-center justify-center bg-primary bg-opacity-40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div>
              <Button className="font-quicksand rounded-full bg-white py-2 px-4 font-bold text-primary shadow-lg transition-colors hover:bg-pinky-dark hover:text-white">
                Read More
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-grow p-4">
          <h2 className="font-quicksand mb-2 min-h-[3rem] text-xl font-bold text-pinky-dark line-clamp-2">
            {article.title}
          </h2>
          <p className="mb-4 min-h-[4rem] text-sm text-gray-600 line-clamp-3">
            {article.description}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between px-4 pb-4">
          <div className="text-xs">
            <p className="font-semibold text-primary">{Array.isArray(article.name) ? article.name[0] : article.name}</p>
            <p className="text-gray-500">{formatDate(article.publishedAt)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
