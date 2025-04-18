import { Link } from "wouter";
import { Article } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/image-helper";
import { LazyImage } from "@/components/ui/lazy-image";

interface FeaturedArticleCardProps {
  article: Article;
}

export function FeaturedArticleCard({ article }: FeaturedArticleCardProps) {
  // Use imageUrl from MainImageLink or fall back to placeholder
  let imageSource = article.imageUrl ? getImageUrl(article.imageUrl) : '/api/images/placeholder';
  console.log(`Featured article ${article.id} - Using imageUrl: ${article.imageUrl || 'Not available, using placeholder'}`);
  
  // Make sure the image is going through our proxy if it's an external URL
  if (imageSource && !imageSource.startsWith('/api/images/') && (imageSource.startsWith('http://') || imageSource.startsWith('https://'))) {
    // Create a hash of the URL to use as an ID for the proxy
    const encodedUrl = encodeURIComponent(imageSource);
    imageSource = `/api/images/${encodedUrl}`;
  }
  
  return (
    <Link href={`/articles/${article.id}`} className="block">
      <div className="article-card bg-pink-50 rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow">
        <div className="md:flex">
          <div className="md:w-2/5 flex items-center justify-center">
            <div className="h-80 w-full bg-pink-100/50 relative overflow-hidden">
              <LazyImage 
                src={imageSource} 
                alt={article.title} 
                className="absolute inset-0 w-full h-full object-contain object-center"
                placeholderSrc="/api/images/placeholder"
                threshold={0.2}
                delay={100} // Featured images load first with minimal delay
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
