import { Link } from "wouter";
import { Article } from "@shared/schema";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getImageUrl, getPhotoUrl } from "@/lib/image-helper";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  // Use imageUrl from MainImageLink or fall back to placeholder
  const imageSource = article.imageUrl ? getImageUrl(article.imageUrl) : '/api/images/placeholder';
  console.log(`Article ${article.id} - Using imageUrl: ${article.imageUrl || 'Not available, using placeholder'}`);

  return (
    <Link href={`/articles/${article.id}`} className="block h-full">
      <div className="article-card bg-pink-700 rounded-lg shadow-lg overflow-hidden flex flex-col h-full group cursor-pointer hover:shadow-xl transition-shadow text-white">
        <div className="relative">
          <img 
            src={imageSource} 
            alt={article.title} 
            className="h-48 w-full object-contain bg-pink-600/50"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              console.error(`Failed to load image: ${target.src}`);
              target.src = '/api/images/placeholder';
            }}
          />
          <div className="article-overlay absolute inset-0 bg-pink-500 bg-opacity-40 opacity-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-100">
            <div>
              <Button 
                className="bg-white text-pink-800 font-quicksand font-bold py-2 px-4 rounded-full shadow-lg transition-colors hover:bg-pink-600 hover:text-white"
              >
                Read More
              </Button>
            </div>
          </div>
        </div>
        <div className="p-4 flex-grow">
          <h2 className="font-quicksand font-bold text-xl mb-2 text-white min-h-[3rem] line-clamp-2">
            {article.title}
          </h2>
          <p className="text-pink-100 text-sm mb-4 min-h-[4rem] line-clamp-3">
            {article.description}
          </p>
        </div>
        <div className="px-4 pb-4 mt-auto flex justify-between items-center">
          <div className="text-xs">
            <p className="text-pink-300 font-semibold">{article.name}</p>
            <p className="text-pink-200">{formatDate(article.publishedAt)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
