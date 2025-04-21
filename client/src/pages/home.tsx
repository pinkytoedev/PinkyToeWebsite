import { useQuery } from "@tanstack/react-query";
import React, { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/layout";
import { API_ROUTES } from "@/lib/constants";
import { FeaturedArticleCard } from "@/components/articles/featured-article-card";
import { RecentArticleCard } from "@/components/articles/recent-article-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { CarouselQuote } from "@shared/schema";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Add window property for quote logging state
declare global {
  interface Window {
    __quotesLogged?: boolean;
  }
}

export default function Home() {
  const [autoPlayInterval, setAutoPlayInterval] = useState<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<{ scrollNext: () => void } | null>(null);

  const { data: featuredArticles = [], isLoading: featuredLoading } = useQuery<any[]>({
    queryKey: [API_ROUTES.FEATURED_ARTICLES],
  });

  const { data: recentArticles = [], isLoading: recentLoading } = useQuery<any[]>({
    queryKey: [API_ROUTES.RECENT_ARTICLES],
  });

  // We'll share the quotes query with Layout using the same query key
  const { data: allQuotes = [], isLoading: quotesLoading } = useQuery<CarouselQuote[]>({
    queryKey: ["/api/quotes"]
  });
  
  // Filter the philo quotes
  const quotes = Array.isArray(allQuotes) ? allQuotes : [];
  const philoQuotes = quotes.filter((quote: CarouselQuote) => quote.carousel === "philo");
  
  // For debugging purposes, only log on initial load
  useEffect(() => {
    if (quotes.length > 0 && !window.__quotesLogged) {
      window.__quotesLogged = true;
      console.log("All quotes loaded:", quotes);
      console.log("Philo quotes:", philoQuotes);
    }
  }, [quotes.length > 0]);

  // Set up auto-play for the carousel
  useEffect(() => {
    if (philoQuotes.length > 0) {
      // Start auto-play
      const interval = setInterval(() => {
        if (carouselRef.current) {
          carouselRef.current.scrollNext();
        }
      }, 5000); // Change slide every 5 seconds

      setAutoPlayInterval(interval);

      // Clean up interval on unmount
      return () => {
        if (autoPlayInterval) {
          clearInterval(autoPlayInterval);
        }
      };
    }
  }, [philoQuotes.length]); // Only depend on the quotes length, not the ref

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
          <div className="bg-pink-50 rounded-lg shadow-lg overflow-hidden mb-8">
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

          {/* Quotes Carousel Section */}
          <div className="bg-pink-50 rounded-lg shadow-lg overflow-hidden">
            <div className="bg-primary text-white py-3 px-4">
              <h2 className="font-quicksand font-bold text-xl">Quotes</h2>
            </div>
            <div className="p-6" style={{backgroundImage: 'url("/assets/pink-toe-pattern.png")', backgroundSize: '400px'}}>
              <div className="bg-pink-50 bg-opacity-85 p-5 rounded-lg">
                {quotesLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-11/12" />
                    <Skeleton className="h-5 w-3/4" />
                    <div className="mt-3 text-right">
                      <Skeleton className="h-4 w-40 ml-auto" />
                    </div>
                  </div>
                ) : philoQuotes.length > 0 ? (
                  <>
                    <div className="text-xs text-gray-500 mb-2">
                      Debug: Total quotes: {quotes.length}, 
                      Philo quotes: {philoQuotes.length}
                    </div>
                    <div className="relative">
                      <Carousel
                        opts={{
                          align: "center",
                          loop: true,
                          slidesToScroll: 1,
                          containScroll: "trimSnaps",
                          duration: 30,
                        }}
                        setApi={(api) => {
                          if (api) {
                            carouselRef.current = api;
                          }
                        }}
                      >
                        <CarouselContent>
                          {philoQuotes.map((quote: CarouselQuote) => (
                              <CarouselItem key={quote.id} className="pt-1 md:basis-full">
                                <div className="py-2">
                                  <blockquote className="italic text-lg font-pacifico text-pinky-dark min-h-[6rem] flex items-center">
                                    "{quote.quote}"
                                  </blockquote>
                                  <div className="mt-3 text-right text-primary font-quicksand font-semibold">
                                    - The Pinky Toe Team
                                  </div>
                                </div>
                              </CarouselItem>
                            ))}
                        </CarouselContent>
                        <div className="flex justify-center mt-4">
                          <CarouselPrevious className="relative static mr-2" />
                          <CarouselNext className="relative static ml-2" />
                        </div>
                      </Carousel>
                    </div>
                  </>
                ) : (
                  <>
                    <blockquote className="italic text-lg font-pacifico text-pinky-dark">
                      "Philosophy is the art of questioning everything, including why your pinky toe always finds the furniture."
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