import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createAdminGamesRouter, createPublicGamesRouter } from "@server/routes/games";
import { GamePuzzleStore } from "@server/services/game-puzzle-store";

const content = {
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
let app: express.Express;
let originalEditorUsername: string | undefined;
let originalEditorPassword: string | undefined;

beforeEach(async () => {
  originalEditorUsername = process.env.GAMES_EDITOR_USERNAME;
  originalEditorPassword = process.env.GAMES_EDITOR_PASSWORD;
  directory = await mkdtemp(join(tmpdir(), "pinkytoe-games-api-"));
  const store = new GamePuzzleStore(join(directory, "games.json"));
  app = express();
  app.use(express.json());
  app.use("/api/admin/games", createAdminGamesRouter(store));
  app.use("/api/games", createPublicGamesRouter(store, () => "2026-11-07"));
  process.env.GAMES_EDITOR_USERNAME = "editor";
  process.env.GAMES_EDITOR_PASSWORD = "editor-password";
});

afterEach(async () => {
  if (originalEditorUsername === undefined) delete process.env.GAMES_EDITOR_USERNAME;
  else process.env.GAMES_EDITOR_USERNAME = originalEditorUsername;
  if (originalEditorPassword === undefined) delete process.env.GAMES_EDITOR_PASSWORD;
  else process.env.GAMES_EDITOR_PASSWORD = originalEditorPassword;
  await rm(directory, { recursive: true, force: true });
});

describe("games routes", () => {
  it("requires editor credentials to read drafts or save content", async () => {
    const write = await request(app)
      .put("/api/admin/games/2026-11-07")
      .send({ status: "published", content });
    expect(write.status).toBe(401);

    const read = await request(app).get("/api/admin/games/2026-11-07");
    expect(read.status).toBe(401);
  });

  it("publishes content which is then returned by the public daily route", async () => {
    const saved = await request(app)
      .put("/api/admin/games/2026-11-07")
      .auth("editor", "editor-password")
      .send({ status: "published", content });
    expect(saved.status).toBe(200);

    const daily = await request(app).get("/api/games/2026-11-07");
    expect(daily.status).toBe(200);
    expect(daily.headers["cache-control"]).toBe("no-store");
    expect(daily.body.content.toedle.answer).toBe("HEELS");
  });

  it("rejects incorrect passwords and leaves published games public", async () => {
    const unauthorized = await request(app)
      .get("/api/admin/games/2026-11-07")
      .auth("editor", "wrong-password");
    expect(unauthorized.status).toBe(401);

    const publicDaily = await request(app).get("/api/games/2026-11-07");
    expect(publicDaily.status).toBe(200);
  });

  it("keeps a scheduled puzzle private until its UTC date", async () => {
    const saved = await request(app)
      .put("/api/admin/games/2026-11-08")
      .auth("editor", "editor-password")
      .send({ status: "published", content });
    expect(saved.status).toBe(200);
    const future = await request(app).get("/api/games/2026-11-08");
    expect(future.status).toBe(200);
    expect(future.body).toEqual({ date: "2026-11-08", publishedAt: null, content: null });
    const editor = await request(app).get("/api/admin/games/2026-11-08").auth("editor", "editor-password");
    expect(editor.body.published.content.toedle.answer).toBe("HEELS");
  });

  it("validates calendar dates and puzzle content", async () => {
    const invalidDate = await request(app).get("/api/games/2026-02-31");
    expect(invalidDate.status).toBe(400);

    const invalidPuzzle = await request(app)
      .put("/api/admin/games/2026-11-07")
      .auth("editor", "editor-password")
      .send({ status: "published", content: { ...content, toedle: { answer: "NO" } } });
    expect(invalidPuzzle.status).toBe(400);
  });

  it("fails closed when editor credentials are not configured", async () => {
    delete process.env.GAMES_EDITOR_USERNAME;
    delete process.env.GAMES_EDITOR_PASSWORD;

    const response = await request(app)
      .get("/api/admin/games/2026-11-07")
      .auth("editor", "editor-password");

    expect(response.status).toBe(503);
  });
});
