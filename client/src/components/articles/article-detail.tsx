import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Article, Team } from "@shared/schema";
import { API_ROUTES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { fetchTeamMembers, fetchArticleById } from "@/lib/api";
import { findTeamMemberByName } from "@/lib/team-matching";
import { ArticleView } from "./article-view";

interface ArticleDetailProps {
  articleId: string;
  onClose: () => void;
}

/**
 * The article read in place, over the list it was opened from.
 *
 * Everything below the chrome is the same `ArticleView` the route page
 * renders, so the two cannot drift again. On a phone this is a full-height
 * sheet rather than a centred box: a dialog inset on all four sides of a
 * 375px screen leaves a column too narrow to read in.
 */
export function ArticleDetail({ articleId, onClose }: ArticleDetailProps) {
  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: [API_ROUTES.ARTICLE_BY_ID(articleId)],
    queryFn: () => fetchArticleById(articleId),
    enabled: !!articleId, // Only run query when articleId is available
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnWindowFocus: false, // Don't refetch on window focus for modal
  });

  const { data: teamMembers } = useQuery<Team[]>({
    queryKey: [API_ROUTES.TEAM],
    queryFn: fetchTeamMembers,
    staleTime: 60000, // Cache for 1 minute
  });

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Close on escape key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Close when clicking outside content area
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const authorTeamMember = findTeamMemberByName(teamMembers, article?.name);
  const photoTeamMember = findTeamMemberByName(teamMembers, article?.name_photo);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={article?.title ?? "Article"}
        className="flex h-full w-full flex-col overflow-hidden bg-pink-50 shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-5xl sm:rounded-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-end border-b border-pink-200/60 bg-pink-50/95 px-3 py-2 backdrop-blur">
          <button
            onClick={onClose}
            aria-label="Close article"
            className="rounded-full p-2 text-pinky-dark transition-colors hover:bg-pink-100 hover:text-primary"
          >
            <X />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {isLoading ? (
            <div className="space-y-4 p-4 sm:p-6">
              <Skeleton className="h-56 w-full rounded-xl sm:h-72" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-48" />
              <div className="mx-auto max-w-[62ch] space-y-3 pt-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className={i % 3 === 2 ? "h-4 w-3/4" : "h-4 w-full"} />
                ))}
              </div>
            </div>
          ) : error || !article ? (
            <div className="p-6">
              <h2 className="font-quicksand mb-2 text-2xl font-bold text-red-500">Error</h2>
              <p className="text-gray-700">Failed to load article. Please try again later.</p>
            </div>
          ) : (
            <ArticleView
              article={article}
              authorHref={authorTeamMember ? `/team/${authorTeamMember.id}` : undefined}
              photoCreditHref={photoTeamMember ? `/team/${photoTeamMember.id}` : undefined}
              // Already inside the dialog's own surface.
              className="mx-0 bg-transparent shadow-none sm:rounded-none"
            />
          )}
        </div>
      </div>
    </div>
  );
}
