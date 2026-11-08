import { useQuery } from "@tanstack/react-query";
import type { PublishedGameDay } from "@shared/game-content";
import { API_ROUTES } from "@/lib/constants";
import { todayKey } from "@/lib/games";

export function useDailyGames() {
  const date = todayKey();
  return useQuery<PublishedGameDay>({
    queryKey: [API_ROUTES.GAMES_DAILY(date)],
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    queryFn: async () => {
      const response = await fetch(API_ROUTES.GAMES_DAILY(date), { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Could not load today's games (${response.status})`);
      }
      return response.json() as Promise<PublishedGameDay>;
    },
  });
}

export function DailyGameNotice({
  game,
  isLoading,
  error,
}: {
  game: string;
  isLoading: boolean;
  error: Error | null;
}) {
  if (isLoading) {
    return <p className="mx-auto max-w-md text-center text-neutral-600" role="status">Loading today's {game}…</p>;
  }
  if (error) {
    return <p className="mx-auto max-w-md text-center text-red-700" role="alert">{error.message}</p>;
  }
  return (
    <p className="mx-auto max-w-md border border-neutral-200 p-5 text-center text-neutral-600" role="status">
      Today's {game} has not been published yet. Please check back soon.
    </p>
  );
}
