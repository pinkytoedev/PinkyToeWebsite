import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Article, Team } from "@shared/schema";
import { Layout } from "@/components/layout/layout";
import { API_ROUTES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { fetchTeamMembers, fetchArticleById } from "@/lib/api";
import { ArticleView } from "@/components/articles/article-view";
import { findTeamMemberByName } from "@/lib/team-matching";

export default function ArticleDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [teamMembers, setTeamMembers] = useState<Team[]>([]);

  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: [API_ROUTES.ARTICLE_BY_ID(id || '')],
    queryFn: () => fetchArticleById(id || ''),
    enabled: !!id, // Only run query when id is available
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Fetch team members for linking
  useEffect(() => {
    const getTeamMembers = async () => {
      try {
        const members = await fetchTeamMembers();
        setTeamMembers(members);
      } catch (err) {
        console.error("Failed to fetch team members:", err);
      }
    };

    getTeamMembers();
  }, []);

  // Arriving from the middle of a scrolled list otherwise drops the reader
  // into the middle of the article.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const goBack = () => {
    setLocation('/articles');
  };

  const authorTeamMember = findTeamMemberByName(teamMembers, article?.name);
  const photoTeamMember = findTeamMemberByName(teamMembers, article?.name_photo);

  return (
    <Layout>
      <div className="mx-auto w-full max-w-5xl">
        <Button
          variant="ghost"
          className="mb-4 flex items-center text-primary hover:text-pinky-dark"
          onClick={goBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Articles
        </Button>

        {isLoading ? (
          <ArticleSkeleton />
        ) : error ? (
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="font-quicksand text-2xl font-bold text-red-500 mb-4">Error</h2>
            <p className="text-gray-700">Failed to load article. Please try again later.</p>
          </div>
        ) : article ? (
          <ArticleView
            article={article}
            authorHref={authorTeamMember ? `/team/${authorTeamMember.id}` : undefined}
            photoCreditHref={photoTeamMember ? `/team/${photoTeamMember.id}` : undefined}
          />
        ) : null}
      </div>
    </Layout>
  );
}

/** Shaped like the article it stands in for, so nothing moves when it lands. */
function ArticleSkeleton() {
  return (
    <div className="-mx-6 overflow-hidden bg-pink-50 shadow-lg sm:mx-0 sm:rounded-2xl">
      <div className="p-4 sm:p-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-10 lg:p-8">
        <Skeleton className="h-56 w-full rounded-xl sm:h-72 lg:h-80" />
        <div className="mt-5 space-y-3 lg:mt-0">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="mx-auto max-w-[62ch] space-y-3 px-4 pb-8 sm:px-6 lg:px-8 lg:pb-12">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className={i % 3 === 2 ? "h-4 w-3/4" : "h-4 w-full"} />
        ))}
      </div>
    </div>
  );
}
