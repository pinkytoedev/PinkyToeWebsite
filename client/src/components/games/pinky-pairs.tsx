import { useMemo, useState } from "react";
import { dayNumber, shuffled, todayKey, useLocalState, useStats } from "@/lib/games";
import { cn } from "@/lib/utils";
import { StatsBar } from "./stats-bar";
import { DailyGameNotice, useDailyGames } from "./daily-game";

const MAX_MISTAKES = 4;
const GROUP_COLORS = ["bg-pink-200", "bg-amber-200", "bg-sky-200", "bg-violet-300"];

interface Saved {
  day: string;
  revision: string;
  solved: number[];
  mistakes: number;
}

export function PinkyPairs() {
  const { data: daily, isLoading, error } = useDailyGames();
  const puzzle = daily?.content?.pairs;
  const today = todayKey();
  const [saved, setSaved] = useLocalState<Saved>("pinky-games:pairs:state", { day: today, revision: "", solved: [], mistakes: 0 });
  const { stats, record } = useStats("pairs");
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const state = saved.day === today && saved.revision === daily?.publishedAt
    ? saved
    : { day: today, revision: daily?.publishedAt ?? "", solved: [], mistakes: 0 };
  const won = state.solved.length === 4;
  const lost = state.mistakes >= MAX_MISTAKES;
  const done = won || lost;

  const order = useMemo(
    () => puzzle ? shuffled(puzzle.groups.flatMap((g) => g.words), dayNumber()) : [],
    [puzzle],
  );
  const revealed = lost ? [0, 1, 2, 3] : state.solved;
  const solvedWords = new Set(puzzle ? revealed.flatMap((i) => puzzle.groups[i].words) : []);
  const remaining = order.filter((w) => !solvedWords.has(w));

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 1800);
  };

  const toggle = (word: string) => {
    if (done) return;
    setSelected((s) => (s.includes(word) ? s.filter((w) => w !== word) : s.length < 4 ? [...s, word] : s));
  };

  const submit = () => {
    if (!puzzle) return;
    if (selected.length !== 4) return;
    const hit = puzzle.groups.findIndex(
      (g, i) => !state.solved.includes(i) && selected.every((w) => (g.words as string[]).includes(w)),
    );
    if (hit >= 0) {
      const solved = [...state.solved, hit];
      setSaved({ ...state, solved });
      if (solved.length === 4) record(true);
      flash("Got it!");
    } else {
      const oneAway = puzzle.groups.some(
        (g) => selected.filter((w) => (g.words as string[]).includes(w)).length === 3,
      );
      const mistakes = state.mistakes + 1;
      setSaved({ ...state, mistakes });
      if (mistakes >= MAX_MISTAKES) record(false);
      flash(oneAway ? "One away…" : "Nope.");
    }
    setSelected([]);
  };

  if (!puzzle) {
    return <DailyGameNotice game="Pinky Pairs" isLoading={isLoading} error={error} />;
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-center text-sm text-neutral-600 mb-4">
        Find four groups of four words that belong together. Four mistakes and you're out.
      </p>
      <div className="h-6 text-center text-sm font-bold text-primary" aria-live="polite">
        {message}
      </div>

      <div className="space-y-2 mb-2">
        {revealed.map((i) => (
          <div key={i} className={cn("p-3 text-center", GROUP_COLORS[i])}>
            <p className="font-bold uppercase text-sm">{puzzle.groups[i].title}</p>
            <p className="text-sm">{puzzle.groups[i].words.join(", ")}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {remaining.map((word) => (
          <button
            key={word}
            onClick={() => toggle(word)}
            aria-pressed={selected.includes(word)}
            className={cn(
              "h-16 text-xs sm:text-sm font-bold uppercase transition-colors px-1 break-words",
              selected.includes(word) ? "bg-neutral-800 text-white" : "bg-neutral-100 hover:bg-neutral-200",
            )}
          >
            {word}
          </button>
        ))}
      </div>

      {!done && (
        <>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm">
            Mistakes left:
            {Array.from({ length: MAX_MISTAKES - state.mistakes }).map((_, i) => (
              <span key={i} className="h-3 w-3 rounded-full bg-neutral-700" />
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setSelected([])}
              className="border border-neutral-400 px-4 py-2 font-bold hover:bg-neutral-100"
            >
              Deselect
            </button>
            <button
              onClick={submit}
              disabled={selected.length !== 4}
              className="bg-primary text-white px-4 py-2 font-bold disabled:opacity-40 hover:bg-pinky-dark transition-colors"
            >
              Submit
            </button>
          </div>
        </>
      )}

      {done && (
        <p className="text-center font-bold mt-4">{won ? "Perfectly paired." : "Out of toes. Try again tomorrow."}</p>
      )}

      <StatsBar stats={stats} />
    </div>
  );
}
