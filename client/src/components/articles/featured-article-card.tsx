import { Link } from "wouter";
import { Article } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getImageUrl, getPhotoUrl } from "@/lib/image-helper";

interface FeaturedArticleCardProps {
  article: Article;
}

export function FeaturedArticleCard({ article }: FeaturedArticleCardProps) {
  // Use photo if imageUrl is not available
  const imageSource = article.imageUrl ? getImageUrl(article.imageUrl) : getPhotoUrl(article.photo);
  
  return (
    <div className="article-card bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="md:flex">
        <div className="md:w-2/5">
          <img 
            src={imageSource} 
            alt={article.title} 
            className="h-64 w-full object-cover"
          />
        </div>
        <div className="p-6 md:w-3/5">
          <div className="uppercase tracking-wide text-sm text-primary font-semibold">Featured</div>
          <h2 className="font-quicksand font-bold text-2xl mt-2 mb-4 text-pinky-dark">
            {article.title}
          </h2>
          <p className="text-gray-600 mb-4">
            {article.description}
          </p>
          <div className="flex items-center">
            <div className="text-sm">
              <p className="text-primary font-semibold">{article.author}</p>
              <p className="text-gray-500">{formatDate(article.publishedAt)}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href={`/articles/${article.id}`}>
              <Button className="bg-primary hover:bg-pinky-dark text-white font-quicksand font-bold py-2 px-4 rounded transition-colors">
                Read More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
