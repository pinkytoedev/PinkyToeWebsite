import { Layout } from "@/components/layout/layout";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchFeaturedArticles, fetchRecentArticles, fetchQuotes } from "@/lib/api";
import { FeaturedArticleCard } from "@/components/articles/featured-article-card";
import { RecentArticleCard } from "@/components/articles/recent-article-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Article, CarouselQuote } from "@shared/schema";
import Autoplay from "embla-carousel-autoplay";
import React from "react";

export default function Home() {
  const { 
    data: featuredArticles, 
    isLoading: featuredLoading 
  } = useQuery<Article[]>({
    queryKey: ["articles", "featured"],
    queryFn: fetchFeaturedArticles,
  });

  const { 
    data: recentArticles, 
    isLoading: recentLoading 
  } = useQuery<Article[]>({
    queryKey: ["articles", "recent"],
    queryFn: () => fetchRecentArticles(4),
  });

  const { 
    data: quotes, 
    isLoading: quotesLoading 
  } = useQuery<CarouselQuote[]>({
    queryKey: ["quotes"],
    queryFn: fetchQuotes,
  });

  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  return (
    <Layout>
      <div className="space-y-8 animate-fadeIn">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-pink-500 to-secondary shadow-2xl">
          <div className="absolute inset-0 bg-pattern opacity-10"></div>
          <div className="relative px-6 py-16 md:px-12 md:py-24 text-center text-white">
            <h1 className="font-pacifico text-4xl md:text-6xl lg:text-7xl mb-4 drop-shadow-lg">
              The Pinky Toe
            </h1>
            <p className="font-quicksand text-xl md:text-2xl mb-8 max-w-2xl mx-auto font-medium">
              Feminist Humor, Right at Your Feet
            </p>
            <Link href="/articles">
              <Button 
                size="lg" 
                variant="secondary"
                className="font-quicksand font-bold text-lg px-8 hover:scale-105 transition-transform shadow-lg"
              >
                Explore Articles
              </Button>
            </Link>
          </div>
        </div>

        {/* Featured Articles Section */}
        {featuredArticles && featuredArticles.length > 0 && (
          <section>
            <h2 className="font-quicksand font-bold text-3xl mb-6 text-center text-gray-800">
              Featured Articles
            </h2>
            {featuredLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-4 space-y-3">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </Card>
                ))}
              </div>
            ) : (
              <Carousel
                plugins={[plugin.current]}
                className="w-full max-w-6xl mx-auto"
                onMouseEnter={plugin.current.stop}
                onMouseLeave={plugin.current.reset}
              >
                <CarouselContent className="-ml-4">
                  {featuredArticles.map((article) => (
                    <CarouselItem key={article.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                      <FeaturedArticleCard article={article} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex" />
                <CarouselNext className="hidden md:flex" />
              </Carousel>
            )}
          </section>
        )}

        {/* Two Column Layout for Recent Articles and Quotes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Articles Section */}
          <div className="bg-gray-50 rounded-lg shadow-lg overflow-hidden">
            <div className="bg-primary text-white py-3 px-4 flex justify-between items-center">
              <h2 className="font-quicksand font-bold text-xl">Recent Articles</h2>
              <Link href="/articles">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:text-gray-200 hover:bg-white/10"
                >
                  View All →
                </Button>
              </Link>
            </div>
            <div className="p-4">
              {recentLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="p-3">
                      <Skeleton className="h-20 w-full" />
                    </Card>
                  ))}
                </div>
              ) : recentArticles && recentArticles.length > 0 ? (
                <div className="space-y-3">
                  {recentArticles.map((article) => (
                    <RecentArticleCard key={article.id} article={article} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No recent articles available
                </p>
              )}
            </div>
          </div>

          {/* Quotes Carousel Section */}
          <div className="bg-pink-50 rounded-lg shadow-lg overflow-hidden">
            <div className="bg-primary text-white py-3 px-4">
              <h2 className="font-quicksand font-bold text-xl">Quotes</h2>
            </div>
            <div className="p-6" style={{backgroundImage: 'url("/PinkyToeWebsite/attached_assets/background for pinky website.png")', backgroundSize: '250px'}}>
              <div className="bg-white bg-opacity-95 p-5 rounded-lg shadow-inner">
                {quotesLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-11/12" />
                    <Skeleton className="h-4 w-1/3 ml-auto" />
                  </div>
                ) : quotes && quotes.length > 0 ? (
                  <Carousel
                    plugins={[
                      Autoplay({
                        delay: 5000,
                        stopOnInteraction: true,
                      })
                    ]}
                    opts={{
                      align: "start",
                      loop: true,
                    }}
                    className="w-full"
                  >
                    <CarouselContent>
                      {quotes.map((quote, index) => (
                        <CarouselItem key={index}>
                          <div className="p-4">
                            <blockquote className="italic text-lg text-gray-700 leading-relaxed">
                              "{quote.quote}"
                            </blockquote>
                            <p className="text-right text-sm text-gray-600 mt-3 font-medium">
                              — {quote.author || 'Anonymous'}
                            </p>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                ) : (
                  <p className="text-gray-500 text-center">
                    No quotes available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-secondary to-primary rounded-lg shadow-lg p-8 text-center text-white">
          <h2 className="font-quicksand font-bold text-2xl mb-4">
            Join Our Community
          </h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Stay updated with the latest articles, events, and discussions from The Pinky Toe community.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/articles">
              <Button 
                variant="secondary" 
                size="lg"
                className="font-quicksand font-bold hover:scale-105 transition-transform"
              >
                Read Articles
              </Button>
            </Link>
            <Link href="/team">
              <Button 
                variant="outline" 
                size="lg"
                className="font-quicksand font-bold text-white border-white hover:bg-white hover:text-primary hover:scale-105 transition-all"
              >
                Meet the Team
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}