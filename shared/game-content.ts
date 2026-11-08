import { z } from "zod";

export function gameDateUtc(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export const gameDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Enter a valid calendar date");

const textSchema = z.string().trim().min(1).max(120);
const wordSchema = z.string().trim().min(1).max(24);
const toeResultIds = ["pinky", "big", "middle", "stubbed"] as const;

const pairsSchema = z.object({
  groups: z.array(z.object({
    title: textSchema,
    words: z.array(wordSchema).length(4),
  })).length(4),
}).superRefine(({ groups }, ctx) => {
  const words = groups.flatMap((group) => group.words.map((word) => word.toLocaleUpperCase()));
  if (new Set(words).size !== 16) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["groups"], message: "Connections needs 16 unique words" });
  }
});

export const gamesContentSchema = z.object({
  toedle: z.object({
    answer: z.string().trim().regex(/^[a-zA-Z]{5}$/, "Toedle answer must be exactly five letters").transform((word) => word.toUpperCase()),
  }),
  pairs: pairsSchema,
  bingo: z.object({
    squares: z.array(textSchema).length(24),
  }).superRefine(({ squares }, ctx) => {
    if (new Set(squares.map((square) => square.toLocaleLowerCase())).size !== 24) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["squares"], message: "Bingo squares must be unique" });
    }
  }),
  headlineRoulette: z.object({
    subjects: z.array(textSchema).min(2).max(30),
    verbs: z.array(textSchema).min(2).max(30),
    objects: z.array(textSchema).min(2).max(30),
    tails: z.array(textSchema).min(2).max(30),
  }),
  toeQuiz: z.object({
    questions: z.array(z.object({
      q: textSchema,
      answers: z.array(z.object({
        text: textSchema,
        toe: z.enum(toeResultIds),
      })).length(4),
    })).min(1).max(10),
  }),
});

export const gameContentStatusSchema = z.enum(["draft", "published"]);

export type GamesContent = z.infer<typeof gamesContentSchema>;
export type GameContentStatus = z.infer<typeof gameContentStatusSchema>;
export type ToeResultId = typeof toeResultIds[number];

export interface PublishedGameDay {
  date: string;
  publishedAt: string | null;
  content: GamesContent | null;
}

export interface GameDayEntry {
  draft?: GamesContent;
  published?: {
    content: GamesContent;
    publishedAt: string;
  };
}
