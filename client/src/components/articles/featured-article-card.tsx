import { Link } from "wouter";
import { Article } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/image-helper";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";

interface FeaturedArticleCardProps {
  article: Article;
}

export function FeaturedArticleCard({ article }: FeaturedArticleCardProps) {
  // Use imageUrl from MainImageLink or fall back to placeholder
  const imageSource = article.imageUrl ? getImageUrl(article.imageUrl) : PLACEHOLDER_IMAGE;

  return (
    <Link href={`/articles/${article.id}`} className="block">
      <div className="article-card cursor-pointer overflow-hidden rounded-lg bg-pink-50 shadow-lg transition-shadow hover:shadow-xl">
        <div className="md:flex md:items-stretch">
          <div className="md:w-2/5">
            {/*
              Shorter than a screen on a phone, and matched to the text column
              on desktop. The old fixed 20rem box was most of a phone viewport
              before the headline appeared, and left a gap beside a long
              standfirst on desktop.
            */}
            <div className="relative flex h-52 w-full items-center justify-center overflow-hidden bg-pink-100/50 sm:h-64 md:h-full md:min-h-[18rem]">
              {/* Fills the letterboxing a portrait image leaves behind. */}
              <img src={imageSource} alt="" aria-hidden="true" className="article-hero__backdrop" />
              <img
                src={imageSource}
                alt={article.title}
                className="relative max-h-full max-w-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src.endsWith(PLACEHOLDER_IMAGE)) return;
                  // Fallback to our local placeholder if image fails to load
                  target.src = PLACEHOLDER_IMAGE;
                }}
              />
            </div>
          </div>
          <div className="p-5 sm:p-6 md:w-3/5">
            <div className="text-sm font-semibold uppercase tracking-wide text-primary">Featured</div>
            <h2 className="font-quicksand mb-3 mt-2 text-xl font-bold text-pinky-dark sm:text-2xl">
              {article.title}
            </h2>
            <p className="mb-4 text-gray-600 line-clamp-4">
              {article.description}
            </p>
            <div className="flex items-center">
              <div className="text-sm">
                <p className="font-semibold text-primary">{Array.isArray(article.name) ? article.name[0] : article.name}</p>
                <p className="text-gray-500">{formatDate(article.publishedAt)}</p>
              </div>
            </div>
            <div className="mt-4">
              <Button className="font-quicksand rounded bg-primary py-2 px-4 font-bold text-white transition-colors hover:bg-pinky-dark">
                Read More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
