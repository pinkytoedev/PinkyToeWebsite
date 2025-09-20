import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { API_ROUTES, PLACEHOLDER_IMAGE } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { formatDate } from "@/lib/utils";
import { getImageUrl, getPhotoUrl } from "@/lib/image-helper";
import { fetchTeamMemberById, fetchArticlesByIds } from "@/lib/api";

export default function TeamMemberDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: teamMember, isLoading: teamLoading, error: teamError } = useQuery({
    queryKey: [API_ROUTES.TEAM_MEMBER_BY_ID(id!)],
    queryFn: () => fetchTeamMemberById(id!),
    enabled: !!id,
  });


  // Fetch articles for author credits
  const { data: authoredArticles, isLoading: authoredLoading } = useQuery<Article[]>({
    queryKey: [`authored-articles-${id}`],
    queryFn: () => fetchArticlesByIds(teamMember?.authorSub || []),
    enabled: !!teamMember && !!teamMember.authorSub && teamMember.authorSub.length > 0,
  });

  // Fetch articles for photo credits
  const { data: photoCreditArticles, isLoading: photoLoading } = useQuery<Article[]>({
    queryKey: [`photo-credit-articles-${id}`],
    queryFn: () => fetchArticlesByIds(teamMember?.photoSub || []),
    enabled: !!teamMember && !!teamMember.photoSub && teamMember.photoSub.length > 0,
  });

  const goBack = () => {
    setLocation('/team');
  };

  // Get the member image URL from MainImageLink if available, or use placeholder
  const memberImageUrl = teamMember && teamMember.imageUrl
    ? getImageUrl(teamMember.imageUrl)
    : PLACEHOLDER_IMAGE;

  if (teamMember) {
    console.log(`Team member ${teamMember.id} - Using imageUrl: ${teamMember.imageUrl || 'Not available, using placeholder'}`);
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          className="mb-4 flex items-center text-primary hover:text-pinky-dark"
          onClick={goBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Team
        </Button>

        {teamLoading ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
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
        ) : teamError ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="font-quicksand font-bold text-2xl text-red-500 mb-4">Error</h2>
            <p className="text-gray-700">Failed to load team member profile. Please try again later.</p>
          </div>
        ) : teamMember ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="md:flex">
                <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
                  <img
                    src={memberImageUrl}
                    alt={`${teamMember.name} photo`}
                    className="w-full rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.error(`Failed to load team image: ${target.src}`);
                      target.src = PLACEHOLDER_IMAGE;
                    }}
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
                                      <div className="font-quicksand font-semibold text-sm md:text-sm sm:text-base text-pinky-dark hover:text-primary transition-colors cursor-pointer line-clamp-2 py-1 leading-relaxed">
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
                                      <div className="font-quicksand font-semibold text-sm md:text-sm sm:text-base text-pinky-dark hover:text-primary transition-colors cursor-pointer line-clamp-2 py-1 leading-relaxed">
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
        ) : null}
      </div>
    </Layout>
  );
}
