import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { ArticleCard } from "@/components/articles/article-card";
import { ArticleDetail } from "@/components/articles/article-detail";
import { API_ROUTES, ITEMS_PER_PAGE } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

export default function Articles() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [location] = useLocation();
  
  // Extract article ID from URL if present
  const urlArticleId = location.startsWith('/articles/') 
    ? location.split('/articles/')[1] 
    : null;

  // Set selected article ID when URL changes
  if (urlArticleId && urlArticleId !== selectedArticleId) {
    setSelectedArticleId(urlArticleId);
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [API_ROUTES.ARTICLES, page, search],
    refetchOnWindowFocus: false,
  });

  const articles = data?.articles || [];
  const totalArticles = data?.total || 0;
  const totalPages = Math.ceil(totalArticles / ITEMS_PER_PAGE);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1); // Reset to first page on new search
  };

  const handleCloseArticleDetail = () => {
    setSelectedArticleId(null);
    
    // Remove article ID from URL, replace with articles route
    window.history.pushState(null, "", "/articles");
  };

  return (
    <Layout>
      <h1 className="font-quicksand font-bold text-3xl md:text-4xl text-primary mb-6">All Articles</h1>
      
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-8">
        <form onSubmit={handleSearch} className="relative">
          <Input
            type="text"
            placeholder="Search articles by title..."
            className="w-full p-3 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button 
            type="submit"
            variant="ghost"
            className="absolute right-3 top-3 text-primary h-auto p-0"
            aria-label="Search"
          >
            <i className="fas fa-search"></i>
          </Button>
        </form>
      </div>
      
      {/* Articles Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 flex-grow space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="px-4 pb-4 flex justify-between items-center">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-8" />
              </div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-8">
          <h2 className="font-quicksand font-bold text-xl text-pinky-dark mb-2">No Articles Found</h2>
          <p className="text-gray-600">
            {search ? `No articles match "${search}". Try a different search term.` : "There are no articles available at this time."}
          </p>
          {search && (
            <Button 
              className="mt-4 bg-primary hover:bg-pinky-dark text-white"
              onClick={() => {
                setSearchInput("");
                setSearch("");
              }}
            >
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {articles.map((article: any) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="bg-white px-4 py-3 rounded-lg shadow-lg flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPage(page - 1)}
              disabled={page === 1 || isFetching}
              className="text-primary hover:text-pinky-dark mr-4 disabled:text-gray-400"
              aria-label="Previous page"
            >
              <i className="fas fa-chevron-left"></i>
            </Button>
            
            {[...Array(totalPages)].map((_, i) => (
              <Button
                key={i}
                variant={page === i + 1 ? "default" : "ghost"}
                className={
                  page === i + 1 
                    ? "font-quicksand font-bold h-8 w-8 rounded-full bg-primary text-white"
                    : "font-quicksand font-bold h-8 w-8 rounded-full text-primary hover:bg-gray-100 mx-1"
                }
                onClick={() => setPage(i + 1)}
                disabled={isFetching}
              >
                {i + 1}
              </Button>
            ))}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages || isFetching}
              className="text-primary hover:text-pinky-dark ml-4 disabled:text-gray-400"
              aria-label="Next page"
            >
              <i className="fas fa-chevron-right"></i>
            </Button>
          </nav>
        </div>
      )}
      
      {/* Article Detail Modal */}
      {selectedArticleId && (
        <ArticleDetail 
          articleId={selectedArticleId} 
          onClose={handleCloseArticleDetail} 
        />
      )}
    </Layout>
  );
}
