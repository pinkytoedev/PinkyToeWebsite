import { Link } from "wouter";
import { Article } from "@shared/schema";
import { formatDate } from "@/lib/utils";

interface RecentArticleCardProps {
  article: Article;
}

export function RecentArticleCard({ article }: RecentArticleCardProps) {
  return (
    <Link href={`/articles/${article.id}`}>
      <a className="flex space-x-3 pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors rounded p-1">
        <img 
          src={article.imageUrl} 
          alt={article.title} 
          className="w-16 h-16 object-cover rounded"
        />
        <div>
          <h3 className="font-quicksand font-bold text-sm text-pinky-dark">
            {article.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {formatDate(article.publishedAt)}
          </p>
        </div>
      </a>
    </Link>
  );
}
