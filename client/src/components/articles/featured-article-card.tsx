import { Link } from "wouter";
import { Article } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getImageUrl, getPhotoUrl } from "@/lib/image-helper";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";

interface FeaturedArticleCardProps {
  article: Article;
}

export function FeaturedArticleCard({ article }: FeaturedArticleCardProps) {
  // Use imageUrl from MainImageLink or fall back to placeholder
  const imageSource = article.imageUrl ? getImageUrl(article.imageUrl) : PLACEHOLDER_IMAGE;
  console.log(`Featured article ${article.id} - Using imageUrl: ${article.imageUrl || 'Not available, using placeholder'}`);
  console.log(`Featured article ${article.id} - Final imageSource: ${imageSource}`);

  return (
    <Link href={`/articles/${article.id}`} className="block">
      <div className="article-card bg-pink-50 rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow">
        <div className="md:flex">
          <div className="md:w-2/5 flex items-center justify-center">
            <div className="h-80 w-full bg-pink-100/50 relative overflow-hidden">
              <img
                src={imageSource}
                alt={article.title}
                className="absolute inset-0 w-full h-full object-contain object-center"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  console.error(`Failed to load image: ${target.src}`);
                  // Fallback to our local placeholder if image fails to load
                  target.src = PLACEHOLDER_IMAGE;
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
                <p className="text-primary font-semibold">{Array.isArray(article.name) ? article.name[0] : article.name}</p>
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
