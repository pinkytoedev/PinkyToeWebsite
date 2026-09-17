import { Link } from "wouter";
import { Article } from "@shared/schema";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { getImageUrl, getPhotoUrl } from "@/lib/image-helper";
import { isImageLedArticle } from "@/lib/article-content";
import { prepareArticleHtml } from "@/lib/article-html";

/**
 * One article, rendered the same way wherever it appears.
 *
 * The route page and the in-place overlay used to carry separate copies of
 * this markup, which is how they drifted apart. The layout decisions worth
 * making once live here:
 *
 *  - The lead image is capped against the *viewport*, not at a fixed 650px.
 *    650px is half a phone screen taller than the phone, so a portrait image
 *    pushed the headline and every word of the article below the fold.
 *  - Past `lg` the image and the headline sit side by side. A full-width lead
 *    image on a wide screen spends the entire first screen on one picture
 *    while leaving half the width empty; side by side, the reader lands on the
 *    headline, the byline and the opening paragraph at once.
 *  - The body is held to a reading measure instead of being stretched to the
 *    container. Across a 900px column, `prose-lg` runs past 110 characters a
 *    line, which is where the eye starts losing its place on the return sweep.
 *
 * A post with no body is the exception throughout: the picture *is* the
 * article, so it keeps the full width and gets more height, not less.
 */

interface ArticleViewProps {
  article: Article;
  /** Team page for the author, when a team member matched the byline. */
  authorHref?: string;
  /** Team page for the photo credit, when one matched. */
  photoCreditHref?: string;
  className?: string;
}

/** Airtable hands back either a string or a single-element array. */
function firstValue(value: string | string[] | undefined | null): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function ArticleView({ article, authorHref, photoCreditHref, className }: ArticleViewProps) {
  const imageSource = article.imageUrl
    ? getImageUrl(article.imageUrl)
    : article.photo
      ? getPhotoUrl(article.photo)
      : PLACEHOLDER_IMAGE;

  const imageLed = isImageLedArticle(article);
  const authorName = firstValue(article.name);
  const photoCredit = firstValue(article.name_photo);

  return (
    <article
      className={cn(
        // Edge to edge on a phone. The page already sits inside the Layout
        // panel's padding, and spending another 48px of a 375px screen on a
        // second inset border costs more than the border is worth.
        "-mx-6 overflow-hidden bg-pink-50 shadow-lg sm:mx-0 sm:rounded-2xl",
        className,
      )}
    >
      <div
        className={cn(
          "p-4 sm:p-6 lg:p-8",
          !imageLed && "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-10",
        )}
      >
        <ArticleHero src={imageSource} alt={article.title} imageLed={imageLed} />

        <div className={cn("mt-5", !imageLed && "lg:mt-0")}>
          <h1
            className={cn(
              "font-quicksand font-bold text-primary",
              imageLed
                ? "text-2xl sm:text-3xl lg:text-4xl"
                // Half the width to work in once the masthead splits, so the
                // display size steps back up only when there is room for it.
                : "text-2xl sm:text-3xl lg:text-[2rem] lg:leading-[1.18] xl:text-[2.35rem]",
            )}
          >
            {article.title}
          </h1>

          <ArticleByline
            authorName={authorName}
            authorHref={authorHref}
            publishedAt={article.publishedAt}
            photoCredit={photoCredit}
            photoCreditHref={photoCreditHref}
          />

          {/*
            A standfirst, but only when an editor wrote one. When the CMS
            field is left empty the API fills it with the opening of the
            article, which is a good teaser on a card and a bad one here: it
            would sit directly above the very sentences it was cut from and
            make the reader read them twice.

            Tested against `false` rather than for falsiness on purpose. A
            response cached before the flag existed carries no opinion, and
            between showing an opening twice and dropping a standfirst until
            the cache turns over, the second is the smaller loss.
          */}
          {!imageLed && article.description && article.descriptionIsExcerpt === false && (
            <p className="mt-4 text-base text-gray-600 sm:text-lg">{article.description}</p>
          )}
        </div>
      </div>

      <ArticleBody article={article} />
    </article>
  );
}

interface ArticleHeroProps {
  src: string;
  alt: string;
  imageLed: boolean;
}

/**
 * The lead image, sized by what it is rather than by a box.
 *
 * `object-contain` in a fixed frame is what made images "look weird": a
 * portrait meme in a wide frame became a thin strip with two dead pink slabs
 * beside it. Letting the image take its own dimensions - capped by the
 * viewport - and filling the remainder with a blurred copy of itself means
 * every aspect ratio lands in a frame that looks deliberate. Nothing is ever
 * cropped; on these images the crop is usually where the joke is.
 */
export function ArticleHero({ src, alt, imageLed }: ArticleHeroProps) {
  return (
    <figure className="article-hero relative flex items-center justify-center overflow-hidden rounded-xl bg-pink-100/60">
      <img src={src} alt="" aria-hidden="true" className="article-hero__backdrop" />
      <img
        src={src}
        alt={alt}
        className={cn(
          "article-hero__media relative block h-auto w-auto max-w-full object-contain",
          imageLed && "article-hero__media--lead",
        )}
        onError={event => {
          const target = event.target as HTMLImageElement;
          if (target.src.endsWith(PLACEHOLDER_IMAGE)) return;
          target.src = PLACEHOLDER_IMAGE;
        }}
      />
    </figure>
  );
}

interface ArticleBylineProps {
  authorName: string;
  authorHref?: string;
  publishedAt: Article["publishedAt"];
  photoCredit?: string;
  photoCreditHref?: string;
}

/**
 * Author, date and photo credit on one line.
 *
 * Stacked, these three short strings took four lines of vertical space in the
 * masthead and pushed the article down for no gain; they wrap on their own
 * when the screen is too narrow for the row.
 */
export function ArticleByline({
  authorName,
  authorHref,
  publishedAt,
  photoCredit,
  photoCreditHref,
}: ArticleBylineProps) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      {authorName &&
        (authorHref ? (
          <Link href={authorHref} className="font-semibold text-primary hover:underline">
            {authorName}
          </Link>
        ) : (
          <span className="font-semibold text-primary">{authorName}</span>
        ))}

      {authorName && <span aria-hidden="true" className="text-gray-400">&middot;</span>}

      <span className="text-gray-500">{formatDate(publishedAt)}</span>

      {photoCredit && (
        <>
          <span aria-hidden="true" className="text-gray-400">&middot;</span>
          {photoCreditHref ? (
            <Link href={photoCreditHref} className="text-xs text-gray-500 hover:underline">
              Photo: {photoCredit}
            </Link>
          ) : (
            <span className="text-xs text-gray-500">Photo: {photoCredit}</span>
          )}
        </>
      )}
    </div>
  );
}

/**
 * The article text, or nothing at all.
 *
 * A post with no body used to render an empty `prose` block, which left a gap
 * under the byline that reads as a page that failed to load.
 */
export function ArticleBody({ article }: { article: Article }) {
  if (isImageLedArticle(article)) return null;

  return (
    <div className="px-4 pb-8 sm:px-6 lg:px-8 lg:pb-12">
      {article.contentFormat === "html" ? (
        <div
          className="article-prose"
          dangerouslySetInnerHTML={{ __html: prepareArticleHtml(article.content) }}
        />
      ) : (
        <div className="article-prose">
          <p className="whitespace-pre-line">{article.content}</p>
        </div>
      )}
    </div>
  );
}
