import { useCallback, useEffect, useState } from "react";
import { gameDateUtc } from "@shared/game-content";

/** Day number used by result sharing; official puzzles are selected by their published date. */
const EPOCH = new Date(2025, 0, 1);

export function todayKey(d = new Date()): string {
  return gameDateUtc(d);
}

export function dayNumber(d = new Date()): number {
  const a = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const b = Date.UTC(EPOCH.getFullYear(), EPOCH.getMonth(), EPOCH.getDate());
  return Math.floor((a - b) / 86_400_000);
}

/* ---------- Toedle (word guess) ---------- */

export type LetterState = "correct" | "present" | "absent";

export function scoreGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = Array(guess.length).fill("absent");
  const remaining: Record<string, number> = {};
  for (let i = 0; i < answer.length; i++) {
    if (guess[i] === answer[i]) result[i] = "correct";
    else remaining[answer[i]] = (remaining[answer[i]] ?? 0) + 1;
  }
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === "correct") continue;
    if (remaining[guess[i]] > 0) {
      result[i] = "present";
      remaining[guess[i]]--;
    }
  }
  return result;
}

/* ---------- Pinky Pairs (connections) ---------- */

export interface PairGroup {
  title: string;
  words: [string, string, string, string];
}

export interface PairsPuzzle {
  groups: [PairGroup, PairGroup, PairGroup, PairGroup];
}

export const PAIRS_PUZZLES: PairsPuzzle[] = [
  {
    groups: [
      { title: "Things in a pedicure", words: ["POLISH", "FILE", "SOAK", "CALLUS"] },
      { title: "Ways to say 'I'm fine' (I'm not)", words: ["FINE", "WHATEVER", "SURE", "GREAT"] },
      { title: "Satire sections", words: ["OPINION", "HEADLINE", "SIDEBAR", "CORRECTION"] },
      { title: "Kinds of toe", words: ["PINKY", "BIG", "STUBBED", "MIDDLE"] },
    ],
  },
  {
    groups: [
      { title: "Group chat roles", words: ["LURKER", "HYPE", "PLANNER", "GOSSIP"] },
      { title: "Brunch order", words: ["MIMOSA", "WAFFLE", "AVOCADO", "BENEDICT"] },
      { title: "Shoe parts", words: ["SOLE", "HEEL", "TONGUE", "LACE"] },
      { title: "Email sign-offs", words: ["BEST", "THANKS", "REGARDS", "CHEERS"] },
    ],
  },
  {
    groups: [
      { title: "Fake-news verbs", words: ["BLASTS", "SLAMS", "DESTROYS", "EVISCERATES"] },
      { title: "Things you lose", words: ["KEYS", "PATIENCE", "SOCKS", "ARGUMENT"] },
      { title: "Paper parts", words: ["MASTHEAD", "COLUMN", "FOLD", "BYLINE"] },
      { title: "Cat behaviors", words: ["KNEAD", "PURR", "KNOCK", "ZOOM"] },
    ],
  },
  {
    groups: [
      { title: "Self-care", words: ["BATH", "MASK", "NAP", "WALK"] },
      { title: "Meeting-speak", words: ["CIRCLE", "SYNERGY", "ALIGN", "BANDWIDTH"] },
      { title: "Pink ___", words: ["FLOYD", "PANTHER", "LADY", "SLIP"] },
      { title: "Sock problems", words: ["HOLE", "ODD", "LOST", "STATIC"] },
    ],
  },
];

export function shuffled<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  let s = seed + 1;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ---------- Persistence ---------- */

export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable (private mode) */
    }
  }, [key, value]);

  return [value, setValue] as const;
}

export interface Stats {
  played: number;
  wins: number;
  streak: number;
  best: number;
  lastWon: string | null;
}

export const EMPTY_STATS: Stats = { played: 0, wins: 0, streak: 0, best: 0, lastWon: null };

function yesterdayKey(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return todayKey(d);
}

export function recordResult(stats: Stats, won: boolean): Stats {
  const streak = won ? (stats.lastWon === yesterdayKey() ? stats.streak + 1 : 1) : 0;
  return {
    played: stats.played + 1,
    wins: stats.wins + (won ? 1 : 0),
    streak,
    best: Math.max(stats.best, streak),
    lastWon: won ? todayKey() : stats.lastWon,
  };
}

export function useStats(game: string) {
  const [stats, setStats] = useLocalState<Stats>(`pinky-games:${game}:stats`, EMPTY_STATS);
  const record = useCallback((won: boolean) => setStats((s) => recordResult(s, won)), [setStats]);
  return { stats, record };
}
