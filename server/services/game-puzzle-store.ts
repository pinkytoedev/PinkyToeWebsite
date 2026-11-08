import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { z } from "zod";
import {
  gameDateSchema,
  gamesContentSchema,
  type GameContentStatus,
  type GameDayEntry,
  type GamesContent,
  type PublishedGameDay,
} from "@shared/game-content";

const gameDayEntrySchema = z.object({
  draft: gamesContentSchema.optional(),
  published: z.object({
    content: gamesContentSchema,
    publishedAt: z.string().datetime(),
  }).optional(),
});
const dataSchema = z.record(gameDateSchema, gameDayEntrySchema);

export interface GamePuzzleRepository {
  getPublic(date: string): Promise<PublishedGameDay>;
  getEntry(date: string): Promise<GameDayEntry>;
  save(date: string, status: GameContentStatus, content: GamesContent): Promise<GameDayEntry>;
}

export class GamePuzzleStore implements GamePuzzleRepository {
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async getPublic(date: string): Promise<PublishedGameDay> {
    const entry = await this.getEntry(date);
    return {
      date,
      publishedAt: entry.published?.publishedAt ?? null,
      content: entry.published?.content ?? null,
    };
  }

  async getEntry(date: string): Promise<GameDayEntry> {
    const normalizedDate = gameDateSchema.parse(date);
    const data = await this.readData();
    return data[normalizedDate] ?? {};
  }

  async save(date: string, status: GameContentStatus, content: GamesContent): Promise<GameDayEntry> {
    const normalizedDate = gameDateSchema.parse(date);
    const validatedContent = gamesContentSchema.parse(content);
    const task = this.writeQueue.then(async () => {
      const data = await this.readData();
      const entry = data[normalizedDate] ?? {};
      if (status === "draft") {
        entry.draft = validatedContent;
      } else {
        entry.published = {
          content: validatedContent,
          publishedAt: new Date().toISOString(),
        };
        delete entry.draft;
      }
      data[normalizedDate] = entry;
      await this.writeData(data);
      return entry;
    });
    this.writeQueue = task.then(() => undefined, () => undefined);
    return task;
  }

  private async readData(): Promise<Record<string, GameDayEntry>> {
    let raw: string;
    try {
      raw = await readFile(this.filePath, "utf8");
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        return {};
      }
      throw error;
    }

    const parsedJson: unknown = JSON.parse(raw);
    return dataSchema.parse(parsedJson);
  }

  private async writeData(data: Record<string, GameDayEntry>): Promise<void> {
    const folder = dirname(this.filePath);
    await mkdir(folder, { recursive: true });
    const tempPath = join(folder, `.${basename(this.filePath)}.${randomUUID()}.tmp`);
    await writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    await rename(tempPath, this.filePath);
  }
}

export function createGamePuzzleStore(env: NodeJS.ProcessEnv = process.env): GamePuzzleRepository {
  const filePath = env.GAMES_DATA_FILE?.trim();
  if (env.NODE_ENV === "production" && (!filePath || !isAbsolute(filePath))) {
    const unavailable = async (): Promise<never> => {
      throw new Error("GAMES_DATA_FILE must be an absolute path on a persistent volume in production");
    };
    return { getPublic: unavailable, getEntry: unavailable, save: unavailable };
  }
  return new GamePuzzleStore(resolve(filePath || join(process.cwd(), "data", "games.json")));
}

export const gamePuzzleStore = createGamePuzzleStore();
