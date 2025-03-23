import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Team, Article } from "@shared/schema";
import { API_ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { Link } from "wouter";

interface TeamDetailProps {
  teamMemberId: string;
  onClose: () => void;
}

export function TeamDetail({ teamMemberId, onClose }: TeamDetailProps) {
  const { data: teamMember, isLoading: teamLoading, error: teamError } = useQuery<Team>({
    queryKey: [API_ROUTES.TEAM_MEMBER_BY_ID(teamMemberId)],
  });

  const { data: articles, isLoading: articlesLoading } = useQuery<Article[]>({
    queryKey: [`/api/team/${teamMemberId}/articles`],
    enabled: !!teamMember,
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
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <Skeleton className="h-8 w-3/4" />
            <button onClick={onClose} className="text-pinky-dark hover:text-primary text-2xl">
              <X />
            </button>
          </div>
          <div className="p-6">
            <div className="md:flex">
              <div className="md:w-1/3 mb-6 md:mb-0 md:pr-6">
                <Skeleton className="w-full h-64 rounded-lg" />
                <Skeleton className="h-6 w-3/4 mt-4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </div>
              <div className="md:w-2/3">
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
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
        <div className="bg-white rounded-lg max-w-4xl w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="font-quicksand font-bold text-2xl text-primary">{teamMember.name}</h2>
          <button onClick={onClose} className="text-pinky-dark hover:text-primary text-2xl">
            <X />
          </button>
        </div>
        <div className="p-6">
          <div className="md:flex">
            <div className="md:w-1/3 mb-6 md:mb-0 md:pr-6">
              <img 
                src={teamMember.imageUrl} 
                alt={`${teamMember.name} photo`} 
                className="w-full rounded-lg" 
              />
              
              <div className="mt-4">
                <h3 className="font-quicksand font-bold text-xl text-pinky-dark">{teamMember.name}</h3>
                <p className="text-primary font-semibold">{teamMember.role}</p>
              </div>
            </div>
            
            <div className="md:w-2/3">
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">{teamMember.bio}</p>
              </div>
              
              {articles && articles.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-quicksand font-bold text-xl text-pinky-dark mb-4">
                    Recent Articles by {teamMember.name}
                  </h3>
                  
                  <div className="space-y-4">
                    {articlesLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ) : (
                      articles.map((article) => (
                        <div key={article.id} className="flex border-b border-gray-200 pb-3">
                          <img 
                            src={article.imageUrl} 
                            alt={article.title} 
                            className="w-20 h-20 object-cover rounded mr-4" 
                          />
                          <div>
                            <Link href={`/articles/${article.id}`}>
                              <a onClick={onClose} className="font-quicksand font-semibold text-pinky-dark hover:text-primary transition-colors">
                                {article.title}
                              </a>
                            </Link>
                            <p className="text-gray-500 text-sm">{formatDate(article.publishedAt)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
