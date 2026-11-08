import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGamePuzzleStore, GamePuzzleStore } from "@server/services/game-puzzle-store";
import type { GamesContent } from "@shared/game-content";

const content: GamesContent = {
  toedle: { answer: "HEELS" },
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

let directory = "";
let filePath = "";
let store: GamePuzzleStore;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "pinkytoe-games-"));
  filePath = join(directory, "games.json");
  store = new GamePuzzleStore(filePath);
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("GamePuzzleStore", () => {
  it("keeps drafts private until published", async () => {
    await store.save("2026-11-07", "draft", content);
    expect((await store.getPublic("2026-11-07")).content).toBeNull();
    expect((await store.getEntry("2026-11-07")).draft?.toedle.answer).toBe("HEELS");

    await store.save("2026-11-07", "published", content);
    const daily = await store.getPublic("2026-11-07");
    expect(daily.content?.toedle.answer).toBe("HEELS");
    expect(daily.publishedAt).toBeTruthy();
  });

  it("serializes concurrent writes without losing different dates", async () => {
    await Promise.all([
      store.save("2026-11-07", "draft", content),
      store.save("2026-11-08", "draft", content),
    ]);

    const data = JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;
    expect(Object.keys(data).sort()).toEqual(["2026-11-07", "2026-11-08"]);
  });

  it("does not hide malformed persisted data", async () => {
    await writeFile(filePath, "{broken", "utf8");
    await expect(store.getEntry("2026-11-07")).rejects.toThrow();
  });

  it("rejects impossible dates", async () => {
    await expect(store.getEntry("2026-02-31")).rejects.toThrow();
  });

  it("fails closed in production without an absolute persistent storage path", async () => {
    for (const path of [undefined, "relative-games.json"]) {
      const repository = createGamePuzzleStore({ NODE_ENV: "production", GAMES_DATA_FILE: path });
      await expect(repository.getEntry("2026-11-07")).rejects.toThrow("GAMES_DATA_FILE");
      await expect(repository.save("2026-11-07", "published", content)).rejects.toThrow("GAMES_DATA_FILE");
    }
    const configured = createGamePuzzleStore({ NODE_ENV: "production", GAMES_DATA_FILE: filePath });
    await configured.save("2026-11-07", "published", content);
    expect((await configured.getPublic("2026-11-07")).content?.toedle.answer).toBe("HEELS");
  });
});
