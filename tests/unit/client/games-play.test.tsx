import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toedle } from "@/components/games/toedle";
import { PinkyPairs } from "@/components/games/pinky-pairs";
import { PatriarchyBingo } from "@/components/games/patriarchy-bingo";
import { HeadlineRoulette } from "@/components/games/headline-roulette";
import { WhichToe } from "@/components/games/which-toe";
import type { GamesContent } from "@shared/game-content";

const published: GamesContent = {
  toedle: { answer: "BRAVE" },
  pairs: {
    groups: [
      { title: "First group", words: ["ALPHA", "BETA", "GAMMA", "DELTA"] },
      { title: "Second group", words: ["ONE", "TWO", "THREE", "FOUR"] },
      { title: "Third group", words: ["RED", "BLUE", "GREEN", "PINK"] },
      { title: "Fourth group", words: ["CAT", "DOG", "BIRD", "FISH"] },
    ],
  },
  bingo: { squares: Array.from({ length: 24 }, (_, i) => `Edited square ${i + 1}`) },
  headlineRoulette: {
    subjects: ["Edited subject", "Other subject"],
    verbs: ["Edited verb", "Other verb"],
    objects: ["Edited object", "Other object"],
    tails: ["Edited subhead", "Other subhead"],
  },
  toeQuiz: {
    questions: [{
      q: "Edited question?",
      answers: [
        { text: "Pinky answer", toe: "pinky" },
        { text: "Big answer", toe: "big" },
        { text: "Middle answer", toe: "middle" },
        { text: "Stubbed answer", toe: "stubbed" },
      ],
    }],
  },
};

vi.mock("@/components/games/daily-game", () => ({
  useDailyGames: () => ({
    data: { date: "2026-11-07", publishedAt: "2026-11-07T00:00:00.000Z", content: published },
    isLoading: false,
    error: null,
  }),
  DailyGameNotice: () => <p>No game available</p>,
}));

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("published games", () => {
  it("uses the editor's exact Toedle answer", () => {
    render(<Toedle />);
    for (const letter of "BRAVE") fireEvent.keyDown(window, { key: letter });
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.getByText("Toe-tally nailed it.")).toBeInTheDocument();
  });

  it("accepts the editor's Connections group", () => {
    render(<PinkyPairs />);
    for (const word of ["ALPHA", "BETA", "GAMMA", "DELTA"]) fireEvent.click(screen.getByRole("button", { name: word }));
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(screen.getByText("First group")).toBeInTheDocument();
  });

  it("lets a player mark the editor's bingo squares", () => {
    render(<PatriarchyBingo />);
    for (let i = 1; i <= 5; i++) fireEvent.click(screen.getByRole("button", { name: `Edited square ${i}` }));
    expect(screen.getByText(/BINGO! 1 line/)).toBeInTheDocument();
  });

  it("spins using the editor's headline prompts", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<HeadlineRoulette />);
    expect(within(screen.getByRole("article")).getByRole("heading")).toHaveTextContent("Edited subject Edited verb Edited object");
    fireEvent.click(screen.getByRole("button", { name: /Who/ }));
    fireEvent.click(screen.getByRole("button", { name: "Spin" }));
    expect(screen.getByRole("button", { name: /Who/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows the editor's quiz question and scores its answer", () => {
    render(<WhichToe />);
    expect(screen.getByText("Edited question?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Big answer" }));
    expect(screen.getByRole("heading", { name: "The Big Toe" })).toBeInTheDocument();
  });
});
