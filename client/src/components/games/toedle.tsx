import { useEffect, useMemo, useState } from "react";
import {
  dayNumber,
  scoreGuess,
  todayKey,
  useLocalState,
  useStats,
  type LetterState,
} from "@/lib/games";
import { cn } from "@/lib/utils";
import { StatsBar } from "./stats-bar";
import { DailyGameNotice, useDailyGames } from "./daily-game";

const ROWS = 6;
const COLS = 5;
const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

interface Saved {
  day: string;
  answer: string;
  guesses: string[];
}

const TILE: Record<LetterState, string> = {
  correct: "bg-primary border-primary text-white",
  present: "bg-amber-400 border-amber-400 text-white",
  absent: "bg-neutral-500 border-neutral-500 text-white",
};

export function Toedle() {
  const { data: daily, isLoading, error } = useDailyGames();
  const answer = daily?.content?.toedle.answer;
  const today = todayKey();
  const [saved, setSaved] = useLocalState<Saved>("pinky-games:toedle:state", { day: today, answer: "", guesses: [] });
  const { stats, record } = useStats("toedle");
  const [current, setCurrent] = useState("");
  const [message, setMessage] = useState("");

  const guesses = answer && saved.day === today && saved.answer === answer ? saved.guesses : [];
  const won = Boolean(answer && guesses.includes(answer));
  const lost = !won && guesses.length >= ROWS;
  const done = won || lost;

  const keyStates = useMemo(() => {
    const map: Record<string, LetterState> = {};
    if (!answer) return map;
    const rank = { absent: 0, present: 1, correct: 2 };
    for (const g of guesses) {
      scoreGuess(g, answer).forEach((s, i) => {
        const prev = map[g[i]];
        if (!prev || rank[s] > rank[prev]) map[g[i]] = s;
      });
    }
    return map;
  }, [guesses, answer]);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 1600);
  };

  const submit = () => {
    if (!answer) return;
    if (current.length < COLS) return flash("Not enough letters");
    const next = [...guesses, current];
    setSaved({ day: today, answer, guesses: next });
    setCurrent("");
    if (current === answer) record(true);
    else if (next.length >= ROWS) record(false);
  };

  const press = (key: string) => {
    if (done) return;
    if (key === "ENTER") return submit();
    if (key === "DEL") return setCurrent((c) => c.slice(0, -1));
    if (/^[A-Z]$/.test(key)) setCurrent((c) => (c.length < COLS ? c + key : c));
  };

  useEffect(() => {
    if (!answer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") press("ENTER");
      else if (e.key === "Backspace") press("DEL");
      else if (e.key.length === 1) press(e.key.toUpperCase());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, current, done, guesses]);

  const share = () => {
    if (!answer) return;
    const grid = guesses
      .map((g) =>
        scoreGuess(g, answer)
          .map((s) => (s === "correct" ? "🟪" : s === "present" ? "🟨" : "⬜"))
          .join(""),
      )
      .join("\n");
    const text = `Toedle #${dayNumber()} ${won ? guesses.length : "X"}/${ROWS}\n${grid}`;
    navigator.clipboard?.writeText(text).then(() => flash("Copied to clipboard"));
  };

  if (!answer) {
    return <DailyGameNotice game="Toedle" isLoading={isLoading} error={error} />;
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="text-center text-sm text-neutral-600 mb-4">
        Guess today's five-letter word in six tries. Pink means right spot, yellow means wrong spot.
      </p>
      <div className="h-6 text-center text-sm font-bold text-primary" aria-live="polite">
        {message}
      </div>

      <div className="grid gap-1.5 mx-auto w-fit mb-6" role="grid" aria-label="Toedle board">
        {Array.from({ length: ROWS }).map((_, r) => {
          const guess = guesses[r];
          const isCurrent = r === guesses.length && !done;
          const letters = guess ?? (isCurrent ? current : "");
          const states = guess ? scoreGuess(guess, answer) : null;
          return (
            <div key={r} className="grid grid-cols-5 gap-1.5" role="row">
              {Array.from({ length: COLS }).map((_, c) => (
                <div
                  key={c}
                  role="gridcell"
                  className={cn(
                    "h-14 w-14 sm:h-16 sm:w-16 border-2 flex items-center justify-center text-2xl font-bold uppercase",
                    states ? TILE[states[c]] : letters[c] ? "border-neutral-500" : "border-neutral-300",
                  )}
                >
                  {letters[c]}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {done ? (
        <div className="text-center border border-neutral-200 p-4 mb-4">
          <p className="font-bold text-lg mb-1">{won ? "Toe-tally nailed it." : "Stubbed it."}</p>
          {lost && <p className="mb-2">Today's word was <span className="font-bold text-primary">{answer}</span>.</p>}
          <button onClick={share} className="bg-primary text-white font-bold px-4 py-2 hover:bg-pinky-dark transition-colors">
            Share result
          </button>
          <p className="text-xs text-neutral-500 mt-2">A new word arrives at midnight UTC.</p>
        </div>
      ) : (
        <div className="space-y-1.5" aria-label="Keyboard">
          {KEY_ROWS.map((row, i) => (
            <div key={row} className="flex justify-center gap-1">
              {i === 2 && <KeyButton wide label="ENTER" onPress={press} />}
              {row.split("").map((k) => (
                <KeyButton key={k} label={k} state={keyStates[k]} onPress={press} />
              ))}
              {i === 2 && <KeyButton wide label="DEL" onPress={press} />}
            </div>
          ))}
        </div>
      )}

      <StatsBar stats={stats} />
    </div>
  );
}

function KeyButton({
  label,
  state,
  wide,
  onPress,
}: {
  label: string;
  state?: LetterState;
  wide?: boolean;
  onPress: (k: string) => void;
}) {
  return (
    <button
      onClick={() => onPress(label)}
      className={cn(
        "h-12 rounded font-bold text-xs sm:text-sm transition-colors",
        wide ? "px-3" : "w-8 sm:w-10",
        state ? TILE[state] : "bg-neutral-200 hover:bg-neutral-300 text-neutral-900",
      )}
    >
      {label}
    </button>
  );
}
