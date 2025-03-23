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
  let imageSource = article.imageUrl ? getImageUrl(article.imageUrl) : getPhotoUrl(article.photo);
  
  // Make sure the image is going through our proxy if it's an external URL
  if (imageSource && !imageSource.startsWith('/api/images/') && (imageSource.startsWith('http://') || imageSource.startsWith('https://'))) {
    // Create a hash of the URL to use as an ID for the proxy
    const encodedUrl = encodeURIComponent(imageSource);
    imageSource = `/api/images/${encodedUrl}`;
  }
  
  return (
    <Link href={`/articles/${article.id}`} className="block">
      <div className="article-card bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow">
        <div className="md:flex">
          <div className="md:w-2/5 flex items-center justify-center">
            <div className="h-64 w-full bg-gray-50 relative overflow-hidden">
              <img 
                src={imageSource} 
                alt={article.title} 
                className="absolute inset-0 w-full h-full object-contain object-center"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  console.error(`Failed to load image: ${target.src}`);
                  // Fallback to our local placeholder if image fails to load
                  target.src = '/api/images/placeholder';
                }}
              />
            </div>
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
                <p className="text-primary font-semibold">{article.name}</p>
                <p className="text-gray-500">{formatDate(article.publishedAt)}</p>
              </div>
            </div>
            <div className="mt-4">
              <Button className="bg-primary hover:bg-pinky-dark text-white font-quicksand font-bold py-2 px-4 rounded transition-colors">
                Read More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
