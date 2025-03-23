import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { TeamCard } from "@/components/team/team-card";
import { TeamDetail } from "@/components/team/team-detail";
import { API_ROUTES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { fetchTeamMembers } from "@/lib/api";
import { Team as TeamType } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function Team() {
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [location] = useLocation();
  
  // Extract team member ID from URL if present
  const urlTeamMemberId = location.startsWith('/team/') 
    ? location.split('/team/')[1] 
    : null;

  // Set selected team member ID when URL changes
  if (urlTeamMemberId && urlTeamMemberId !== selectedTeamMemberId) {
    setSelectedTeamMemberId(urlTeamMemberId);
  }

  const { data: teamMembers, isLoading, error } = useQuery<TeamType[]>({
    queryKey: [API_ROUTES.TEAM],
    queryFn: fetchTeamMembers,
  });
  
  // Extract unique roles from team members for filter options
  const uniqueRoles = useMemo(() => {
    if (!teamMembers) return [];
    
    const roles = teamMembers.map(member => member.role);
    return Array.from(new Set(roles)).filter(Boolean).sort();
  }, [teamMembers]);
  
  // Filter team members based on selected role
  const filteredTeamMembers = useMemo(() => {
    if (!teamMembers) return [];
    if (!selectedRole) return teamMembers;
    
    return teamMembers.filter(member => member.role === selectedRole);
  }, [teamMembers, selectedRole]);

  const handleCloseTeamDetail = () => {
    setSelectedTeamMemberId(null);
    
    // Remove team member ID from URL, replace with team route
    window.history.pushState(null, "", "/team");
  };

  return (
    <Layout>
      <h1 className="font-quicksand font-bold text-3xl md:text-4xl text-primary mb-6">Meet Our Team</h1>
      
      <p className="text-gray-600 mb-4 text-lg max-w-3xl">
        We're a group of feminist writers, comedians, and thinkers who believe that humor can be a powerful tool for change. Get to know the minds behind The Pinky Toe!
      </p>
      
      {/* Role Filter UI */}
      {!isLoading && !error && teamMembers && teamMembers.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-gray-700">Filter by role:</h3>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={selectedRole === null ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedRole(null)}
                className="rounded-full"
              >
                All Roles
              </Button>
              
              {uniqueRoles.map(role => (
                <Button
                  key={role}
                  variant={selectedRole === role ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRole(role)}
                  className="rounded-full"
                >
                  {role}
                </Button>
              ))}
            </div>
            
            {selectedRole && (
              <div className="mt-2 flex items-center">
                <span className="text-sm text-gray-500 mr-2">Active filter:</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  {selectedRole}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => setSelectedRole(null)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove filter</span>
                  </Button>
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}
      
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
      ) : error ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="font-quicksand font-bold text-xl text-red-500 mb-2">Unable to Load Team</h2>
          <p className="text-gray-600 mb-3">We're having trouble connecting to our team database. Please try again later.</p>
          <p className="text-sm text-gray-500">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      ) : teamMembers?.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="font-quicksand font-bold text-xl text-pinky-dark mb-2">No Team Members Found</h2>
          <p className="text-gray-600">There are no team members available at this time.</p>
        </div>
      ) : (
        <>
          {filteredTeamMembers.length === 0 && selectedRole ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <h2 className="font-quicksand font-bold text-xl text-amber-500 mb-2">No Team Members Found</h2>
              <p className="text-gray-600 mb-4">There are no team members with the role "{selectedRole}".</p>
              <Button 
                onClick={() => setSelectedRole(null)} 
                variant="outline"
                className="mx-auto"
              >
                Clear Filter
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeamMembers.map((member: TeamType) => (
                <TeamCard key={member.id} teamMember={member} />
              ))}
            </div>
          )}
          
          {/* Show count if filtering */}
          {selectedRole && filteredTeamMembers.length > 0 && (
            <p className="mt-4 text-sm text-gray-500">
              Showing {filteredTeamMembers.length} team member{filteredTeamMembers.length !== 1 ? 's' : ''} with role "{selectedRole}"
            </p>
          )}
        </>
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
