import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Article } from "@shared/schema";
import { API_ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { getImageUrl, getPhotoUrl } from "@/lib/image-helper";

interface ArticleDetailProps {
  articleId: string;
  onClose: () => void;
}

export function ArticleDetail({ articleId, onClose }: ArticleDetailProps) {
  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: [API_ROUTES.ARTICLE_BY_ID(articleId)],
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

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleBackdropClick}>
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <Skeleton className="h-8 w-3/4" />
            <button onClick={onClose} className="text-pinky-dark hover:text-primary text-2xl">
              <X />
            </button>
          </div>
          <div className="p-6">
            <Skeleton className="w-full h-80 rounded-lg mb-6" />
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleBackdropClick}>
        <div className="bg-white rounded-lg max-w-4xl w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-quicksand font-bold text-2xl text-red-500">Error</h2>
            <button onClick={onClose} className="text-pinky-dark hover:text-primary text-2xl">
              <X />
            </button>
          </div>
          <p className="text-gray-700">
            Failed to load article. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Use photo if imageUrl is not available
  const imageSource = article.imageUrl ? getImageUrl(article.imageUrl) : getPhotoUrl(article.photo);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="font-quicksand font-bold text-2xl text-primary">{article.title}</h2>
          <button onClick={onClose} className="text-pinky-dark hover:text-primary text-2xl">
            <X />
          </button>
        </div>
        <div className="p-6">
          <img 
            src={imageSource} 
            alt={article.title} 
            className="w-full h-80 object-cover rounded-lg mb-6"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              console.error(`Failed to load image: ${target.src}`);
              target.src = '/api/images/placeholder';
            }}
          />
          
          <div className="flex items-center mb-6">
            <div className="text-sm">
              <p className="text-primary font-semibold">{article.name}</p>
              <p className="text-gray-500">{formatDate(article.publishedAt)}</p>
              {article.name_photo && (
                <p className="text-gray-500 text-xs mt-1">Photo Credit: {article.name_photo}</p>
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
    </div>
  );
}
