import { describe, expect, it } from "vitest";
import { gameDateUtc, gamesContentSchema } from "@shared/game-content";

const validContent = {
  toedle: { answer: "heels" },
  pairs: {
    groups: [
      { title: "Group A", words: ["A1", "A2", "A3", "A4"] },
      { title: "Group B", words: ["B1", "B2", "B3", "B4"] },
      { title: "Group C", words: ["C1", "C2", "C3", "C4"] },
      { title: "Group D", words: ["D1", "D2", "D3", "D4"] },
    ],
  },
  bingo: { squares: Array.from({ length: 24 }, (_, index) => `Square ${index + 1}`) },
  headlineRoulette: {
    subjects: ["Local Cat", "Area Husband"],
    verbs: ["Discovers", "Explains"],
    objects: ["a tiny problem", "a large problem"],
    tails: ["Nothing changes", "Experts are concerned"],
  },
  toeQuiz: {
    questions: [{
      q: "Pick one",
      answers: [
        { text: "One", toe: "pinky" },
        { text: "Two", toe: "big" },
        { text: "Three", toe: "middle" },
        { text: "Four", toe: "stubbed" },
      ],
    }],
  },
};

describe("gamesContentSchema", () => {
  it("uses UTC for the common daily rollover", () => {
    expect(gameDateUtc(new Date("2026-11-07T23:59:59Z"))).toBe("2026-11-07");
    expect(gameDateUtc(new Date("2026-11-08T00:00:00Z"))).toBe("2026-11-08");
  });
  it("accepts complete game content and normalizes the Toedle answer", () => {
    const parsed = gamesContentSchema.parse(validContent);
    expect(parsed.toedle.answer).toBe("HEELS");
  });

  it("rejects a Toedle answer that is not exactly five letters", () => {
    const parsed = gamesContentSchema.safeParse({
      ...validContent,
      toedle: { answer: "toe" },
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects duplicate Connections words and incomplete Bingo cards", () => {
    const duplicatePairs = structuredClone(validContent);
    duplicatePairs.pairs.groups[1].words[0] = "A1";
    expect(gamesContentSchema.safeParse(duplicatePairs).success).toBe(false);

    const shortBingo = structuredClone(validContent);
    shortBingo.bingo.squares.pop();
    expect(gamesContentSchema.safeParse(shortBingo).success).toBe(false);
  });
});
