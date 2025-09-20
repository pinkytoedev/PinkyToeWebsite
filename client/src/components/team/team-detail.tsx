import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Team, Article } from "@shared/schema";
import { API_ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { Link } from "wouter";
import { getImageUrl, getPhotoUrl } from "@/lib/image-helper";
import { fetchTeamMemberById, fetchArticlesByIds } from "@/lib/api";

interface TeamDetailProps {
  teamMemberId: string;
  onClose: () => void;
}

export function TeamDetail({ teamMemberId, onClose }: TeamDetailProps) {
  const { data: teamMember, isLoading: teamLoading, error: teamError } = useQuery<Team>({
    queryKey: [API_ROUTES.TEAM_MEMBER_BY_ID(teamMemberId)],
    queryFn: () => fetchTeamMemberById(teamMemberId),
    enabled: !!teamMemberId,
  });


  // Fetch articles for author credits
  const { data: authoredArticles, isLoading: authoredLoading } = useQuery<Article[]>({
    queryKey: [`authored-articles-${teamMemberId}`],
    queryFn: () => fetchArticlesByIds(teamMember?.authorSub || []),
    enabled: !!teamMember && !!teamMember.authorSub && teamMember.authorSub.length > 0,
  });

  // Fetch articles for photo credits
  const { data: photoCreditArticles, isLoading: photoLoading } = useQuery<Article[]>({
    queryKey: [`photo-credit-articles-${teamMemberId}`],
    queryFn: () => fetchArticlesByIds(teamMember?.photoSub || []),
    enabled: !!teamMember && !!teamMember.photoSub && teamMember.photoSub.length > 0,
  });

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Re-enable scroll when modal is closed
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

  if (teamLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleBackdropClick}>
        <div className="bg-white rounded-lg max-w-6xl w-full max-h-screen overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <Skeleton className="h-8 w-3/4" />
            <button onClick={onClose} className="text-pinky-dark hover:text-primary text-2xl">
              <X />
            </button>
          </div>
          <div className="p-6">
            <div className="md:flex">
              <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
                <Skeleton className="w-full h-64 rounded-lg" />
                <Skeleton className="h-6 w-3/4 mt-4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
                <div className="mt-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="space-y-6">
                  <div>
                    <Skeleton className="h-5 w-1/3 mb-3" />
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </div>
                  <div>
                    <Skeleton className="h-5 w-1/3 mb-3" />
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (teamError || !teamMember) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleBackdropClick}>
        <div className="bg-white rounded-lg max-w-6xl w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-quicksand font-bold text-2xl text-red-500">Error</h2>
            <button onClick={onClose} className="text-pinky-dark hover:text-primary text-2xl">
              <X />
            </button>
          </div>
          <p className="text-gray-700">
            Failed to load team member profile. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Get the member image URL
  const memberImageUrl = getImageUrl(teamMember.imageUrl);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-screen overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="font-quicksand font-bold text-2xl text-primary">{teamMember.name}</h2>
          <button onClick={onClose} className="text-pinky-dark hover:text-primary text-2xl">
            <X />
          </button>
        </div>
        <div className="p-6">
          <div className="md:flex">
            <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
              <img
                src={memberImageUrl}
                alt={`${teamMember.name} photo`}
                className="w-full rounded-lg"
              />

              <div className="mt-4">
                <h3 className="font-quicksand font-bold text-xl text-pinky-dark">{teamMember.name}</h3>
                <p className="text-primary font-semibold">{teamMember.role}</p>
              </div>

              <div className="prose max-w-none mt-6">
                <p className="whitespace-pre-line text-gray-700 leading-relaxed">{teamMember.bio}</p>
              </div>
            </div>

            <div className="md:w-1/2">
              <div className="space-y-6">
                <div>
                  <h4 className="font-quicksand font-bold text-lg text-pinky-dark mb-3">Author Credits</h4>
                  {authoredLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : authoredArticles && authoredArticles.length > 0 ? (
                    <div className="max-h-64 md:max-h-80 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {authoredArticles
                        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
                        .map((article) => {
                          const articleImageUrl = article.imageUrl ? getImageUrl(article.imageUrl) : getPhotoUrl(article.photo);
                          return (
                            <div key={article.id} className="flex border-b border-gray-200 pb-3 mb-3 last:border-b-0">
                              <img
                                src={articleImageUrl}
                                alt={article.title}
                                className="w-16 h-16 md:w-16 md:h-16 sm:w-20 sm:h-20 object-cover rounded mr-3 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <Link href={`/articles/${article.id}`}>
                                  <div
                                    onClick={onClose}
                                    className="font-quicksand font-semibold text-sm md:text-sm sm:text-base text-pinky-dark hover:text-primary transition-colors cursor-pointer line-clamp-2 py-1 leading-relaxed"
                                  >
                                    {article.title}
                                  </div>
                                </Link>
                                <p className="text-gray-500 text-xs md:text-xs sm:text-sm mt-1">{formatDate(article.publishedAt)}</p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No authored articles</p>
                  )}
                </div>

                <div>
                  <h4 className="font-quicksand font-bold text-lg text-pinky-dark mb-3">Photo Credits</h4>
                  {photoLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : photoCreditArticles && photoCreditArticles.length > 0 ? (
                    <div className="max-h-64 md:max-h-80 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {photoCreditArticles
                        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
                        .map((article) => {
                          const articleImageUrl = article.imageUrl ? getImageUrl(article.imageUrl) : getPhotoUrl(article.photo);
                          return (
                            <div key={article.id} className="flex border-b border-gray-200 pb-3 mb-3 last:border-b-0">
                              <img
                                src={articleImageUrl}
                                alt={article.title}
                                className="w-16 h-16 md:w-16 md:h-16 sm:w-20 sm:h-20 object-cover rounded mr-3 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <Link href={`/articles/${article.id}`}>
                                  <div
                                    onClick={onClose}
                                    className="font-quicksand font-semibold text-sm md:text-sm sm:text-base text-pinky-dark hover:text-primary transition-colors cursor-pointer line-clamp-2 py-1 leading-relaxed"
                                  >
                                    {article.title}
                                  </div>
                                </Link>
                                <p className="text-gray-500 text-xs md:text-xs sm:text-sm mt-1">{formatDate(article.publishedAt)}</p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No photo credits</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
