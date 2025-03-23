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
  // Use photo if imageUrl is not available
  const imageSource = article.imageUrl ? getImageUrl(article.imageUrl) : getPhotoUrl(article.photo);

  return (
    <div className="article-card bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full group">
      <div className="relative">
        <img 
          src={imageSource} 
          alt={article.title} 
          className="h-48 w-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            console.error(`Failed to load image: ${target.src}`);
            target.src = '/api/images/placeholder';
          }}
        />
        <div className="article-overlay absolute inset-0 bg-primary bg-opacity-40 opacity-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-100">
          <div>
            <Link href={`/articles/${article.id}`}>
              <Button 
                className="bg-white text-primary font-quicksand font-bold py-2 px-4 rounded-full shadow-lg transition-colors hover:bg-pinky-dark hover:text-white"
              >
                Read More
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="p-4 flex-grow">
        <h2 className="font-quicksand font-bold text-xl mb-2 text-pinky-dark">
          {article.title}
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          {article.description}
        </p>
      </div>
      <div className="px-4 pb-4 flex justify-between items-center">
        <div className="text-xs">
          <p className="text-primary font-semibold">{article.author}</p>
          <p className="text-gray-500">{formatDate(article.publishedAt)}</p>
        </div>
      </div>
    </div>
  );
}
