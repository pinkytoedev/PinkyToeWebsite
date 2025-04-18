import { Link } from "wouter";
import { Team } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/image-helper";
import { LazyImage } from "@/components/ui/lazy-image";

interface TeamCardProps {
  teamMember: Team;
}

export function TeamCard({ teamMember }: TeamCardProps) {
  // Get the image URL from MainImageLink or fall back to placeholder
  const imageSource = teamMember.imageUrl ? getImageUrl(teamMember.imageUrl) : '/api/images/placeholder';
  console.log(`Team member ${teamMember.id} - Using imageUrl: ${teamMember.imageUrl || 'Not available, using placeholder'}`);
  
  return (
    <div className="team-card bg-pink-50 rounded-lg shadow-lg overflow-hidden">
      <div className="relative">
        <LazyImage 
          src={imageSource} 
          alt={`${teamMember.name} photo`} 
          className="h-64 w-full object-cover"
          placeholderSrc="/api/images/placeholder"
          delay={teamMember.id ? parseInt(teamMember.id.slice(-2), 16) * 150 : 400} // Stagger loading based on team ID
          threshold={0.15}
        />
        <div className="team-overlay absolute inset-0 bg-primary bg-opacity-40 opacity-0 flex items-center justify-center transition-opacity duration-300">
          <div>
            <Link href={`/team/${teamMember.id}`}>
              <Button 
                className="bg-white text-primary font-quicksand font-bold py-2 px-4 rounded-full shadow-lg transition-colors hover:bg-pinky-dark hover:text-white"
              >
                View Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h2 className="font-quicksand font-bold text-xl text-pinky-dark">
          {teamMember.name}
        </h2>
        <p className="text-primary font-semibold">{teamMember.role}</p>
        <p className="text-gray-600 mt-2 text-sm line-clamp-2">
          {teamMember.bio}
        </p>
      </div>
    </div>
  );
}
