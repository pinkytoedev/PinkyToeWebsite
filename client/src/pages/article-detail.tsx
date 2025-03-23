import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { API_ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getImageUrl, getPhotoUrl } from "@/lib/image-helper";

export default function ArticleDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: [API_ROUTES.ARTICLE_BY_ID(id || '')],
  });

  const goBack = () => {
    setLocation('/articles');
  };

  // Get the image URL if article is available
  const imageSource = article 
    ? (article.imageUrl ? getImageUrl(article.imageUrl) : getPhotoUrl(article.photo))
    : '';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-4 flex items-center text-primary hover:text-pinky-dark"
          onClick={goBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Articles
        </Button>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <Skeleton className="w-full h-80" />
            <div className="p-6 space-y-6">
              <Skeleton className="h-10 w-3/4" />
              
              <div className="flex items-center">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="font-quicksand font-bold text-2xl text-red-500 mb-4">Error</h2>
            <p className="text-gray-700">Failed to load article. Please try again later.</p>
          </div>
        ) : article ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <img 
              src={imageSource} 
              alt={article.title} 
              className="w-full h-80 object-cover"
            />
            <div className="p-6">
              <h1 className="font-quicksand font-bold text-3xl text-primary mb-4">
                {article.title}
              </h1>
              
              <div className="flex items-center mb-6">
                <div className="text-sm">
                  <p className="text-primary font-semibold">{article.author}</p>
                  <p className="text-gray-500">{formatDate(article.publishedAt)}</p>
                  {article.photoCredit && (
                    <p className="text-gray-500 text-xs mt-1">Photo Credit: {article.photoCredit}</p>
                  )}
                </div>
              </div>
              
              <div className="prose prose-lg max-w-none prose-headings:text-primary prose-a:text-primary hover:prose-a:text-pinky-dark prose-hr:border-gray-300">
                {article.contentFormat === "html" ? (
                  <div dangerouslySetInnerHTML={{ __html: article.content }} />
                ) : (
                  <p className="whitespace-pre-line">{article.content}</p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
