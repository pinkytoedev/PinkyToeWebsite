import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { API_ROUTES } from "@/lib/constants";
import { FeaturedArticleCard } from "@/components/articles/featured-article-card";
import { RecentArticleCard } from "@/components/articles/recent-article-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Home() {
  const { data: featuredArticles, isLoading: featuredLoading } = useQuery({
    queryKey: [API_ROUTES.FEATURED_ARTICLES],
  });

  const { data: recentArticles, isLoading: recentLoading } = useQuery({
    queryKey: [API_ROUTES.RECENT_ARTICLES],
  });

  const { data: quoteOfDay, isLoading: quoteLoading } = useQuery({
    queryKey: [API_ROUTES.QUOTE_OF_DAY],
  });

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Column (70%) */}
        <div className="lg:col-span-8">
          <h1 className="font-quicksand font-bold text-3xl md:text-4xl text-primary mb-6">Featured Articles</h1>
          
          {featuredLoading ? (
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="md:flex">
                  <div className="md:w-2/5">
                    <Skeleton className="h-64 w-full" />
                  </div>
                  <div className="p-6 md:w-3/5 space-y-4">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-32 mt-4" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="md:flex">
                  <div className="md:w-2/5">
                    <Skeleton className="h-64 w-full" />
                  </div>
                  <div className="p-6 md:w-3/5 space-y-4">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-32 mt-4" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {featuredArticles?.map((article: any) => (
                <FeaturedArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
        
        {/* Sidebar Column (30%) */}
        <div className="lg:col-span-4">
          {/* Recent Articles Section */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
            <div className="bg-primary text-white py-3 px-4">
              <h2 className="font-quicksand font-bold text-xl">Recent Articles</h2>
            </div>
            <div className="p-4 space-y-4">
              {recentLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex space-x-3 pb-3 border-b border-gray-200">
                      <Skeleton className="w-16 h-16 rounded" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                recentArticles?.map((article: any) => (
                  <RecentArticleCard key={article.id} article={article} />
                ))
              )}
            </div>
            <div className="px-4 pb-4">
              <Link href="/articles">
                <div className="text-primary hover:text-pinky-dark text-sm font-semibold transition-colors cursor-pointer">
                  View All Articles →
                </div>
              </Link>
            </div>
          </div>
          
          {/* Quote of the Day Section */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-primary text-white py-3 px-4">
              <h2 className="font-quicksand font-bold text-xl">Quote of the Day</h2>
            </div>
            <div className="p-6" style={{backgroundImage: 'url("/assets/pink-toe-pattern.png")', backgroundSize: '400px'}}>
              <div className="bg-white bg-opacity-85 p-5 rounded-lg">
                {quoteLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-11/12" />
                    <Skeleton className="h-5 w-3/4" />
                    <div className="mt-3 text-right">
                      <Skeleton className="h-4 w-40 ml-auto" />
                    </div>
                  </div>
                ) : (
                  <>
                    <blockquote className="italic text-lg font-pacifico text-pinky-dark">
                      "{quoteOfDay?.quote || "In a world full of sharks, be a pinky toe - small but mighty enough to make someone curse when they least expect it."}"
                    </blockquote>
                    <div className="mt-3 text-right text-primary font-quicksand font-semibold">
                      - The Pinky Toe Team
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
