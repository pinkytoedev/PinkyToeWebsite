import { Link } from "wouter";
import { Article } from "@shared/schema";
import { ROUTES, PLACEHOLDER_IMAGE } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getImageUrl, getPhotoUrl } from "@/lib/image-helper";
import { isImageLedArticle } from "@/lib/article-content";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  // Use imageUrl from MainImageLink or fall back to placeholder
  const imageSource = article.imageUrl ? getImageUrl(article.imageUrl) : PLACEHOLDER_IMAGE;

  // A post with no body is the picture and the headline — there is nothing to
  // click through to. Give it the room to be read where it sits.
  const imageLed = isImageLedArticle(article);

  return (
    <Link href={`/articles/${article.id}`} className="block h-full">

      <div className="article-card bg-pink-50 rounded-lg shadow-lg overflow-hidden flex flex-col h-full group cursor-pointer hover:shadow-xl transition-shadow">


        <div className={cn("relative", imageLed && "flex justify-center bg-pink-100/50")}>
          <img
            src={imageSource}
            alt={article.title}
            className={cn(
              "object-contain bg-pink-100/50",
              imageLed
                // Sized by the image, not by a box. A fixed height letterboxes
                // a portrait meme into a narrow strip down the middle, so
                // widening the card does nothing for it — the height is what
                // binds. Letting the element take its own dimensions, capped,
                // means every aspect ratio gets as big as it can. Never
                // object-cover: cropping is how you cut the joke off.
                ? "block w-auto h-auto max-w-full max-h-[70vh]"
                : "h-48 w-full",
            )}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              console.error(`Failed to load image: ${target.src}`);
              target.src = PLACEHOLDER_IMAGE;
            }}
          />
          {/* "Read More" promises something to read, which is exactly what
              these do not have. */}
          {!imageLed && (
            <div className="article-overlay absolute inset-0 bg-primary bg-opacity-40 opacity-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-100">
              <div>
                <Button
                  className="bg-white text-primary font-quicksand font-bold py-2 px-4 rounded-full shadow-lg transition-colors hover:bg-pinky-dark hover:text-white"
                >
                  Read More
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className={cn("flex-grow", imageLed ? "p-4 md:p-6" : "p-4")}>
          <h2
            className={cn(
              "font-quicksand font-bold text-pinky-dark",
              imageLed
                // No clamp and no min-height: the headline is the post, it gets
                // to be as long as it is, and there is no neighbouring card to
                // stay level with.
                ? "text-2xl md:text-3xl"
                : "text-xl mb-2 min-h-[3rem] line-clamp-2",
            )}
          >
            {article.title}
          </h2>
          {/* The description is derived from the body, so an image-led post
              usually has none — rendering it anyway left an empty 4rem gap. */}
          {(!imageLed || article.description) && (
            <p
              className={cn(
                "text-gray-600",
                imageLed ? "text-base mt-2" : "text-sm mb-4 min-h-[4rem] line-clamp-3",
              )}
            >
              {article.description}
            </p>
          )}
        </div>
        <div className="px-4 pb-4 mt-auto flex justify-between items-center">
          <div className="text-xs">
            <p className="text-primary font-semibold">{Array.isArray(article.name) ? article.name[0] : article.name}</p>
            <p className="text-gray-500">{formatDate(article.publishedAt)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
