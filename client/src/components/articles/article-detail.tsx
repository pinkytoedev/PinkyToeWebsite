import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Article, Team } from "@shared/schema";
import { API_ROUTES, PLACEHOLDER_IMAGE } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { getImageUrl, getPhotoUrl } from "@/lib/image-helper";
import { fetchTeamMembers, fetchArticleById } from "@/lib/api";
import { useLocation, Link } from "wouter";

interface ArticleDetailProps {
  articleId: string;
  onClose: () => void;
}

export function ArticleDetail({ articleId, onClose }: ArticleDetailProps) {
  const [, setLocation] = useLocation();

  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: [API_ROUTES.ARTICLE_BY_ID(articleId)],
    queryFn: () => fetchArticleById(articleId),
    enabled: !!articleId, // Only run query when articleId is available
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnWindowFocus: false, // Don't refetch on window focus for modal
  });

  // Fetch all team members to match by name
  const { data: teamMembers, isLoading: isLoadingTeamMembers } = useQuery<Team[]>({
    queryKey: [API_ROUTES.TEAM],
    queryFn: fetchTeamMembers,
    staleTime: 60000, // Cache for 1 minute
    enabled: true, // Always fetch team members
  });

  useEffect(() => {
    if (teamMembers && import.meta.env.DEV) {
      console.log('Team members loaded:', teamMembers.length);
    }
  }, [teamMembers]);

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Scroll to top of the page when article is opened
    window.scrollTo(0, 0);

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

  // Function to find team member by name with improved matching
  const findTeamMemberByName = (name: string | string[] | undefined): Team | undefined => {
    if (!teamMembers || !name) {
      console.log('Team members data not available yet or name is empty');
      return undefined;
    }

    // Handle array of names (take the first one) 
    const nameToMatch = Array.isArray(name) ? name[0] : name;

    if (!nameToMatch) return undefined;

    // Clean up the name - trim spaces and normalize
    const cleanName = nameToMatch.trim().toLowerCase();
    console.log('Searching for team member with cleaned name:', cleanName);

    // Try to find exact match first
    let foundMember = teamMembers.find(member =>
      member.name?.toLowerCase().trim() === cleanName
    );

    // If no exact match, try partial match (name is contained in member name)
    if (!foundMember) {
      foundMember = teamMembers.find(member =>
        member.name?.toLowerCase().includes(cleanName) ||
        cleanName.includes(member.name?.toLowerCase().trim() || '')
      );
    }

    console.log('Found team member?', foundMember ? `Yes, ID: ${foundMember.id}, Name: ${foundMember.name}` : 'No match found');
    return foundMember;
  };

  // Get team member IDs if available - extract string from array if needed
  const getNameString = (name: string | string[] | undefined): string => {
    if (Array.isArray(name)) {
      return name[0] || '';
    }
    return name || '';
  };

  const authorName = getNameString(article.name);
  const photoCredit = getNameString(article.name_photo);

  console.log('Article author name:', authorName);
  console.log('Article photo credit:', photoCredit);

  const authorTeamMember = authorName ? findTeamMemberByName(authorName) : undefined;

  // Better extraction of photo credit name - handle multiple formats
  let photoName = '';
  if (photoCredit) {
    photoName = photoCredit
      .replace(/Photo by /i, '')  // Remove "Photo by " with case insensitivity
      .replace(/Photo credit:/i, '') // Remove "Photo credit:" with case insensitivity
      .trim();
  }

  const photoTeamMember = photoName ? findTeamMemberByName(photoName) : undefined;

  console.log('Author team member:', authorTeamMember);
  console.log('Photo credit team member:', photoTeamMember);

  // Navigate to team member page
  const navigateToTeamMember = (teamMemberId: string) => {
    onClose(); // Close the modal first
    setTimeout(() => {
      setLocation(`/team/${teamMemberId}`);
    }, 100); // Small delay to ensure modal is closed first
  };

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
          <div className="flex justify-center bg-gray-50 py-6 rounded-lg mb-6">
            <img
              src={imageSource}
              alt={article.title}
              className="max-w-full max-h-[650px] object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                console.error(`Failed to load image: ${target.src}`);
                target.src = PLACEHOLDER_IMAGE;
              }}
            />
          </div>

          <div className="flex items-center mb-6">
            <div className="text-sm">
              {authorTeamMember ? (
                <p
                  className="text-primary font-semibold cursor-pointer hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToTeamMember(authorTeamMember.id);
                  }}
                >
                  {authorName} {/* Clickable author name */}
                </p>
              ) : (
                <p className="text-primary font-semibold">{authorName}</p>
              )}
              <p className="text-gray-500">{formatDate(article.publishedAt)}</p>
              {photoCredit && (
                photoTeamMember ? (
                  <p
                    className="text-gray-500 text-xs mt-1 cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToTeamMember(photoTeamMember.id);
                    }}
                  >
                    Photo Credit: {photoCredit}
                  </p>
                ) : (
                  <p className="text-gray-500 text-xs mt-1">
                    Photo Credit: {photoCredit}
                  </p>
                )
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