import { Link } from "wouter";
import { Article } from "@shared/schema";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { getImageUrl } from "@/lib/image-helper";

interface ImageLedArticleRowProps {
  article: Article;
}

/**
 * A post that is a picture and a headline, given the width it needs.
 *
 * These have no body, so there is nothing to click through to - the whole post
 * has to land while scrolling. It used to get a full-width row with the image
 * centred in it, which made the picture big but left a third of the row empty
 * on either side on a desktop, and put the headline so far below the image
 * that they stopped reading as one joke.
 *
 * Side by side fixes both: the image keeps its height, the width goes to the
 * headline instead of to empty pink, and the two sit together. It is the same
 * shape as the featured card on the home page, so the list still looks like
 * the rest of the site.
 */
export function ImageLedArticleRow({ article }: ImageLedArticleRowProps) {
  const imageSource = article.imageUrl ? getImageUrl(article.imageUrl) : PLACEHOLDER_IMAGE;
  const author = Array.isArray(article.name) ? article.name[0] : article.name;

  return (
    <Link href={`/articles/${article.id}`} className="block">
      <div className="article-card cursor-pointer overflow-hidden rounded-lg bg-pink-50 shadow-lg transition-shadow hover:shadow-xl">
        <div className="md:flex md:items-stretch">
          {/*
            Fixed heights rather than a share of the row: the text beside it is
            a headline and a date, so a stretched image column would collapse
            to the height of two lines on a short headline.
          */}
          <figure className="relative flex h-60 w-full items-center justify-center overflow-hidden bg-pink-100/50 sm:h-72 md:h-96 md:w-1/2 lg:h-[26rem] lg:w-[45%]">
            {/* Fills whatever the picture's aspect ratio leaves behind. */}
            <img src={imageSource} alt="" aria-hidden="true" className="article-hero__backdrop" />
            <img
              src={imageSource}
              alt={article.title}
              // Never object-cover: cropping is where the joke usually is.
              className="relative max-h-full max-w-full object-contain"
              onError={event => {
                const target = event.target as HTMLImageElement;
                if (target.src.endsWith(PLACEHOLDER_IMAGE)) return;
                target.src = PLACEHOLDER_IMAGE;
              }}
            />
          </figure>

          <div className="flex flex-col justify-center p-5 sm:p-6 md:w-1/2 lg:w-[55%]">
            {/* No clamp: the headline is the post, so it runs to its length. */}
            <h2 className="font-quicksand text-2xl font-bold text-pinky-dark sm:text-3xl">
              {article.title}
            </h2>

            {/* Derived from the body, so these usually have none. */}
            {article.description && (
              <p className="mt-3 text-base text-gray-600">{article.description}</p>
            )}

            <div className="mt-4 text-xs">
              <p className="font-semibold text-primary">{author}</p>
              <p className="text-gray-500">{formatDate(article.publishedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
