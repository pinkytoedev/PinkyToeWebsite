import { useMemo } from "react";
import { bingoLines } from "@/lib/games-satire";
import { todayKey, useLocalState } from "@/lib/games";
import { cn } from "@/lib/utils";
import { DailyGameNotice, useDailyGames } from "./daily-game";

interface Saved {
  day: string;
  revision: string;
  marked: number[];
}

const FREE = 12;

export function PatriarchyBingo() {
  const { data: daily, isLoading, error } = useDailyGames();
  const today = todayKey();
  const card = useMemo(() => {
    const squares = daily?.content?.bingo.squares;
    if (!squares) return [];
    const c = [...squares];
    c.splice(FREE, 0, "FREE: Still being paid less");
    return c;
  }, [daily?.publishedAt]);
  const [saved, setSaved] = useLocalState<Saved>("pinky-games:bingo:state", { day: today, revision: "", marked: [FREE] });
  const markedIdx = saved.day === today && saved.revision === daily?.publishedAt ? saved.marked : [FREE];
  const marked = card.map((_, i) => markedIdx.includes(i));
  const lines = bingoLines(marked);

  const toggle = (i: number) => {
    if (i === FREE) return;
    const next = markedIdx.includes(i) ? markedIdx.filter((n) => n !== i) : [...markedIdx, i];
    setSaved({ day: today, revision: daily?.publishedAt ?? "", marked: next });
  };

  if (!daily?.content?.bingo) {
    return <DailyGameNotice game="Patriarchy Bingo" isLoading={isLoading} error={error} />;
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-center text-sm text-neutral-600 mb-4">
        Mark every square you've lived this week. Five in a row is a BINGO and also a really long week.
      </p>
      <div className="grid grid-cols-5 gap-1.5">
        {card.map((text, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            aria-pressed={marked[i]}
            className={cn(
              "aspect-square p-1 text-[10px] sm:text-xs font-semibold leading-tight flex items-center justify-center text-center border-2 transition-colors",
              marked[i] ? "bg-primary text-white border-primary" : "bg-white border-neutral-300 hover:border-primary",
              i === FREE && "font-black",
            )}
          >
            {text}
          </button>
        ))}
      </div>
      <p className="text-center font-bold mt-4 min-h-[1.5rem]" aria-live="polite">
        {lines > 0 ? `BINGO! ${lines} line${lines > 1 ? "s" : ""}. Please go lie down.` : `${markedIdx.length - 1} squares marked`}
      </p>
      <div className="text-center mt-2">
        <button
          onClick={() => setSaved({ day: today, revision: daily.publishedAt ?? "", marked: [FREE] })}
          className="text-sm text-neutral-500 underline hover:text-primary"
        >
          Clear card
        </button>
      </div>
    </div>
  );
}
