import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Article, Team } from "@shared/schema";
import { Layout } from "@/components/layout/layout";
import { API_ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getImageUrl } from "@/lib/image-helper";
import { LazyImage } from "@/components/ui/lazy-image";

import { useState, useEffect } from "react";
import { fetchTeamMembers } from "@/lib/api";

export default function ArticleDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [teamMembers, setTeamMembers] = useState<Team[]>([]);
  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: [API_ROUTES.ARTICLE_BY_ID(id || '')],
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

  // Find team member by name with partial matching
  const findTeamMemberByName = (name: string | string[] | undefined): Team | undefined => {
    if (!name || !teamMembers.length) {
      console.log('Team members data not available yet or name is empty');
      return undefined;
    }
    
    // Handle array of names (take the first one)
    const nameToMatch = Array.isArray(name) ? name[0] : name;
    
    if (!nameToMatch) return undefined;
    
    // Normalize the name for comparison (remove extra spaces, lowercase)
    const normalizedName = nameToMatch.trim().toLowerCase();
    
    // First try exact match
    const exactMatch = teamMembers.find(member => {
      return member.name.toLowerCase() === normalizedName;
    });
    
    if (exactMatch) return exactMatch;
    
    // If no exact match, try partial matching (if name contains member name or vice versa)
    return teamMembers.find(member => {
      const memberName = member.name.toLowerCase();
      return normalizedName.includes(memberName) || memberName.includes(normalizedName);
    });
  };

  const goBack = () => {
    setLocation('/articles');
  };


  // Get the image URL from MainImageLink if article is available, or use placeholder
  const imageSource = article && article.imageUrl 
    ? getImageUrl(article.imageUrl)
    : '/api/images/placeholder';
    
  if (article) {
    console.log(`Article detail ${article.id} - Using imageUrl: ${article.imageUrl || 'Not available, using placeholder'}`);
  }
    
  // Get team member IDs if available
  const authorTeamMember = article?.name ? findTeamMemberByName(article.name) : undefined;
  
  // Better extraction of photo credit name - handle multiple formats
  let photoName = '';
  if (article?.name_photo) {
    if (typeof article.name_photo === 'string') {
      photoName = article.name_photo
        .replace(/Photo by /i, '')  // Remove "Photo by " with case insensitivity
        .replace(/Photo credit:/i, '') // Remove "Photo credit:" with case insensitivity
        .trim();
    } else if (Array.isArray(article.name_photo)) {
      // If it's an array and has items, take the first item
      const photoArray = article.name_photo as string[];
      if (photoArray.length > 0) {
        const photoCredit = photoArray[0];
        if (typeof photoCredit === 'string') {
          photoName = photoCredit
            .replace(/Photo by /i, '')
            .replace(/Photo credit:/i, '')
            .trim();
        } else {
          console.log('Photo credit item is not a string:', photoCredit);
        }
      }
    } else {
      console.log('Photo credit is not in an expected format:', article.name_photo);
    }
  }
  
  const photoTeamMember = photoName ? findTeamMemberByName(photoName) : undefined;

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
          <div className="bg-pink-50 rounded-lg shadow-lg overflow-hidden">
            <div className="flex justify-center bg-pink-100/50 py-6">
              <LazyImage 
                src={imageSource} 
                alt={article.title} 
                className="max-w-full max-h-[650px] object-contain" 
                placeholderSrc="/api/images/placeholder"
                threshold={0.2}
                delay={50} // Load article detail image quickly as it's the main content
              />
            </div>
            <div className="p-6">
              <h1 className="font-quicksand font-bold text-3xl text-primary mb-4">
                {article.title}
              </h1>
              
              <div className="flex items-center mb-6">
                <div className="text-sm">
                  {authorTeamMember ? (
                    <Link href={`/team/${authorTeamMember.id}`}>
                      <p className="text-primary font-semibold cursor-pointer hover:underline">
                        {article.name} {/* Clickable author name */}
                      </p>
                    </Link>
                  ) : (
                    <p className="text-primary font-semibold">{article.name}</p>
                  )}
                  <p className="text-gray-500">{formatDate(article.publishedAt)}</p>
                  {article.name_photo && (
                    photoTeamMember ? (
                      <Link href={`/team/${photoTeamMember.id}`}>
                        <p className="text-gray-500 text-xs mt-1 cursor-pointer hover:underline">
                          Photo Credit: {typeof article.name_photo === 'string' 
                            ? article.name_photo 
                            : Array.isArray(article.name_photo) 
                              ? (article.name_photo as string[])[0] 
                              : ''}
                        </p>
                      </Link>
                    ) : (
                      <p className="text-gray-500 text-xs mt-1">
                        Photo Credit: {typeof article.name_photo === 'string' 
                          ? article.name_photo 
                          : Array.isArray(article.name_photo) 
                            ? (article.name_photo as string[])[0] 
                            : ''}
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
        ) : null}
      </div>
    </Layout>
  );
}
