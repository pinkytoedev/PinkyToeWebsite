import { Router } from "express";
import {
  gameContentStatusSchema,
  gameDateSchema,
  gameDateUtc,
  gamesContentSchema,
} from "@shared/game-content";
import { requireGameEditor } from "../middleware/auth";
import { gamePuzzleStore, type GamePuzzleRepository } from "../services/game-puzzle-store";

export function createPublicGamesRouter(
  store: GamePuzzleRepository = gamePuzzleStore,
  getToday: () => string = gameDateUtc,
): Router {
  const router = Router();

  router.get("/:date", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const parsedDate = gameDateSchema.safeParse(req.params.date);
    if (!parsedDate.success) {
      return res.status(400).json({ message: "Invalid game date" });
    }
    if (parsedDate.data > getToday()) {
      return res.json({ date: parsedDate.data, publishedAt: null, content: null });
    }

    try {
      res.json(await store.getPublic(parsedDate.data));
    } catch (error) {
      console.error("Could not load published games:", error);
      res.status(500).json({ message: "Could not load published games" });
    }
  });

  return router;
}

export function createAdminGamesRouter(store: GamePuzzleRepository = gamePuzzleStore): Router {
  const router = Router();
  router.use(requireGameEditor);

  router.get("/:date", async (req, res) => {
    const parsedDate = gameDateSchema.safeParse(req.params.date);
    if (!parsedDate.success) {
      return res.status(400).json({ message: "Invalid game date" });
    }

    try {
      res.json(await store.getEntry(parsedDate.data));
    } catch (error) {
      console.error("Could not load game editor data:", error);
      res.status(500).json({ message: "Could not load game editor data" });
    }
  });

  router.put("/:date", async (req, res) => {
    const parsedDate = gameDateSchema.safeParse(req.params.date);
    const parsedStatus = gameContentStatusSchema.safeParse(req.body?.status);
    const parsedContent = gamesContentSchema.safeParse(req.body?.content);

    if (!parsedDate.success || !parsedStatus.success || !parsedContent.success) {
      return res.status(400).json({
        message: "Invalid game content",
        issues: [
          ...(!parsedDate.success ? parsedDate.error.issues : []),
          ...(!parsedStatus.success ? parsedStatus.error.issues : []),
          ...(!parsedContent.success ? parsedContent.error.issues : []),
        ].map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      });
    }

    try {
      const entry = await store.save(parsedDate.data, parsedStatus.data, parsedContent.data);
      res.json(entry);
    } catch (error) {
      console.error("Could not save game content:", error);
      res.status(500).json({ message: "Could not save game content" });
    }
  });

  return router;
}

export const publicGamesRouter = createPublicGamesRouter();
export const adminGamesRouter = createAdminGamesRouter();
