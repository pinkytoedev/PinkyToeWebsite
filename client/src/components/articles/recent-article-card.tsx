import { Link } from "wouter";
import { Article } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { getImageUrl, getPhotoUrl } from "@/lib/image-helper";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";

interface RecentArticleCardProps {
  article: Article;
}

export function RecentArticleCard({ article }: RecentArticleCardProps) {
  // Use photo if imageUrl is not available
  const imageSource = article.imageUrl ? getImageUrl(article.imageUrl) : getPhotoUrl(article.photo);

  return (
    <div className="block pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors rounded p-1">
      <Link href={`/articles/${article.id}`}>
        <div className="flex space-x-3 cursor-pointer">
          <img
            src={imageSource}
            alt={article.title}
            className="w-16 h-16 object-contain bg-pink-100/50 rounded"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              console.error(`Failed to load image: ${target.src}`);
              target.src = PLACEHOLDER_IMAGE;
            }}
          />
          <div>
            <h3 className="font-quicksand font-bold text-sm text-gray-900">
              {article.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(article.publishedAt)}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
