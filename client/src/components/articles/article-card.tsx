import { Link } from "wouter";
import { Article } from "@shared/schema";
import { ROUTES, PLACEHOLDER_IMAGE } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getImageUrl, getPhotoUrl } from "@/lib/image-helper";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  // Use imageUrl from MainImageLink or fall back to placeholder
  const imageSource = article.imageUrl ? getImageUrl(article.imageUrl) : PLACEHOLDER_IMAGE;
  console.log(`Article ${article.id} - Using imageUrl: ${article.imageUrl || 'Not available, using placeholder'}`);

  return (
    <Link href={`/articles/${article.id}`} className="block h-full">

      <div className="article-card bg-pink-50 rounded-lg shadow-lg overflow-hidden flex flex-col h-full group cursor-pointer hover:shadow-xl transition-shadow">


        <div className="relative">
          <img
            src={imageSource}
            alt={article.title}
            className="h-48 w-full object-contain bg-pink-100/50"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              console.error(`Failed to load image: ${target.src}`);
              target.src = PLACEHOLDER_IMAGE;
            }}
          />
          <div className="article-overlay absolute inset-0 bg-primary bg-opacity-40 opacity-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-100">
            <div>
              <Button
                className="bg-white text-primary font-quicksand font-bold py-2 px-4 rounded-full shadow-lg transition-colors hover:bg-pinky-dark hover:text-white"
              >
                Read More
              </Button>
            </div>
          </div>
        </div>
        <div className="p-4 flex-grow">
          <h2 className="font-quicksand font-bold text-xl mb-2 text-pinky-dark min-h-[3rem] line-clamp-2">
            {article.title}
          </h2>
          <p className="text-gray-600 text-sm mb-4 min-h-[4rem] line-clamp-3">
            {article.description}
          </p>
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
