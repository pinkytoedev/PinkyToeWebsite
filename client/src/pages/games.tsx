import { Link, useRoute } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Toedle } from "@/components/games/toedle";
import { PinkyPairs } from "@/components/games/pinky-pairs";
import { PatriarchyBingo } from "@/components/games/patriarchy-bingo";
import { HeadlineRoulette } from "@/components/games/headline-roulette";
import { WhichToe } from "@/components/games/which-toe";
import { ROUTES } from "@/lib/constants";

const GAMES = [
  {
    id: "toedle",
    name: "Toedle",
    blurb: "A daily five-letter word. Six tries. Zero chill.",
    emoji: "🟪",
    Component: Toedle,
  },
  {
    id: "pairs",
    name: "Pinky Pairs",
    blurb: "Sort sixteen words into four secret groups.",
    emoji: "🦶",
    Component: PinkyPairs,
  },
  {
    id: "bingo",
    name: "Patriarchy Bingo",
    blurb: "Mark every microaggression you survived this week.",
    emoji: "🎯",
    Component: PatriarchyBingo,
  },
  {
    id: "headlines",
    name: "Headline Roulette",
    blurb: "Spin up your own satirical headline. Lock the good parts.",
    emoji: "📰",
    Component: HeadlineRoulette,
  },
  {
    id: "toe-quiz",
    name: "Which Toe Are You?",
    blurb: "A deeply scientific personality quiz about your feet.",
    emoji: "🔮",
    Component: WhichToe,
  },
];

export default function Games() {
  const [match, params] = useRoute<{ id: string }>("/games/:id");
  const game = match ? GAMES.find((g) => g.id === params.id) : undefined;

  if (game) {
    const { Component } = game;
    return (
      <Layout>
        <Link href={ROUTES.GAMES} className="text-sm font-bold uppercase tracking-wide text-primary hover:underline">
          ← All games
        </Link>
        <h1 className="font-quicksand font-bold text-primary text-4xl text-center mt-2 mb-1">{game.name}</h1>
        <p className="text-center text-xs uppercase tracking-widest text-neutral-500 mb-6">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" })} · UTC
        </p>
        <Component />
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="font-quicksand font-bold text-primary text-3xl md:text-4xl mb-6">The Games Desk</h1>
      <div className="grid sm:grid-cols-2 gap-6">
        {GAMES.map((g) => (
          <Link key={g.id} href={`/games/${g.id}`}>
            <div className="group cursor-pointer border border-neutral-300 hover:border-primary p-6 h-full transition-colors">
              <div className="text-4xl mb-3">{g.emoji}</div>
              <h2 className="font-quicksand font-bold text-2xl group-hover:text-primary transition-colors">{g.name}</h2>
              <p className="text-neutral-600 mt-1">{g.blurb}</p>
              <span className="inline-block mt-4 text-sm font-bold uppercase tracking-wide text-primary">Play today's →</span>
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-sm text-neutral-500">
        <Link href="/games/editor" className="underline hover:text-primary">Editorial desk</Link>
      </p>
    </Layout>
  );
}
