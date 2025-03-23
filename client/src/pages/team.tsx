import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { TeamCard } from "@/components/team/team-card";
import { TeamDetail } from "@/components/team/team-detail";
import { API_ROUTES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

export default function Team() {
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string | null>(null);
  const [location] = useLocation();
  
  // Extract team member ID from URL if present
  const urlTeamMemberId = location.startsWith('/team/') 
    ? location.split('/team/')[1] 
    : null;

  // Set selected team member ID when URL changes
  if (urlTeamMemberId && urlTeamMemberId !== selectedTeamMemberId) {
    setSelectedTeamMemberId(urlTeamMemberId);
  }

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: [API_ROUTES.TEAM],
  });

  const handleCloseTeamDetail = () => {
    setSelectedTeamMemberId(null);
    
    // Remove team member ID from URL, replace with team route
    window.history.pushState(null, "", "/team");
  };

  return (
    <Layout>
      <h1 className="font-quicksand font-bold text-3xl md:text-4xl text-primary mb-6">Meet Our Team</h1>
      
      <p className="text-gray-600 mb-8 text-lg max-w-3xl">
        We're a group of feminist writers, comedians, and thinkers who believe that humor can be a powerful tool for change. Get to know the minds behind The Pinky Toe!
      </p>
      
      {/* Team Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <Skeleton className="h-64 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : teamMembers?.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="font-quicksand font-bold text-xl text-pinky-dark mb-2">No Team Members Found</h2>
          <p className="text-gray-600">There are no team members available at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers?.map((member: any) => (
            <TeamCard key={member.id} teamMember={member} />
          ))}
        </div>
      )}
      
      {/* Team Member Detail Modal */}
      {selectedTeamMemberId && (
        <TeamDetail 
          teamMemberId={selectedTeamMemberId} 
          onClose={handleCloseTeamDetail} 
        />
      )}
    </Layout>
  );
}
