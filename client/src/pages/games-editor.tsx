import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { BINGO_SQUARES, HEADLINE_OBJECTS, HEADLINE_SUBJECTS, HEADLINE_TAILS, HEADLINE_VERBS, TOE_QUIZ, TOE_RESULTS } from "@/lib/games-satire";
import { PAIRS_PUZZLES, todayKey } from "@/lib/games";
import { gamesContentSchema, type GameContentStatus, type GameDayEntry, type GamesContent } from "@shared/game-content";
import { Link } from "wouter";
import { API_ROUTES, ROUTES } from "@/lib/constants";

const fieldClass = "w-full border border-neutral-300 bg-white px-3 py-2 focus:border-primary focus:outline-none";
const labelClass = "mb-1 block text-sm font-bold";

function initialContent(): GamesContent {
  return {
    toedle: { answer: "" },
    pairs: { groups: PAIRS_PUZZLES[0].groups.map((group) => ({ title: group.title, words: [...group.words] })) },
    bingo: { squares: BINGO_SQUARES.slice(0, 24) },
    headlineRoulette: {
      subjects: [...HEADLINE_SUBJECTS],
      verbs: [...HEADLINE_VERBS],
      objects: [...HEADLINE_OBJECTS],
      tails: [...HEADLINE_TAILS],
    },
    toeQuiz: {
      questions: TOE_QUIZ.map((question) => ({
        q: question.q,
        answers: question.answers.map((answer) => ({ ...answer })),
      })),
    },
  };
}

function responseError(payload: unknown, status: number): string {
  if (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string") {
    return payload.message;
  }
  return `Request failed (${status})`;
}

export default function GamesEditor() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayKey());
  const [loadedDate, setLoadedDate] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [content, setContent] = useState<GamesContent>(initialContent);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);

  const authorizationHeader = (login: { username: string; password: string }) => {
    const bytes = new TextEncoder().encode(`${login.username}:${login.password}`);
    return `Basic ${btoa(String.fromCharCode(...bytes))}`;
  };

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    const enteredCredentials = { username: usernameInput, password: passwordInput };
    try {
      const response = await fetch(`/api/admin/games/${date}`, {
        headers: { Authorization: authorizationHeader(enteredCredentials) },
      });
      const entry = await response.json() as GameDayEntry & { message?: string };
      if (!response.ok) throw new Error(responseError(entry, response.status));

      setCredentials(enteredCredentials);
      setPasswordInput("");
      const loaded = entry.draft ?? entry.published?.content;
      setContent(loaded ?? initialContent());
      setLoadedDate(date);
      setPublishedAt(entry.published?.publishedAt ?? null);
      setMessage(loaded ? "Signed in. Saved content loaded." : "Signed in. Add the official answer and review the starter prompts.");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    setCredentials(null);
    setUsernameInput("");
    setPasswordInput("");
    setMessage("");
    setError("");
    setPublishedAt(null);
    setLoadedDate(null);
  };

  const updatePairWord = (groupIndex: number, wordIndex: number, value: string) => {
    const groups = [...content.pairs.groups];
    const words = [...groups[groupIndex].words] as [string, string, string, string];
    words[wordIndex] = value;
    groups[groupIndex] = { ...groups[groupIndex], words };
    setContent({ ...content, pairs: { groups } });
  };

  const updateBingoSquare = (index: number, value: string) => {
    const squares = [...content.bingo.squares];
    squares[index] = value;
    setContent({ ...content, bingo: { squares } });
  };

  const loadContent = async () => {
    if (!credentials) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/admin/games/${date}`, {
        headers: { Authorization: authorizationHeader(credentials) },
      });
      const entry = await response.json() as GameDayEntry & { message?: string };
      if (!response.ok) {
        if (response.status === 401) logout();
        throw new Error(responseError(entry, response.status));
      }

      const loaded = entry.draft ?? entry.published?.content;
      setContent(loaded ?? initialContent());
      setLoadedDate(date);
      setPublishedAt(entry.published?.publishedAt ?? null);
      setMessage(loaded ? "Saved content loaded." : "No saved content for this date. Add the official answer and review the starter prompts.");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load game content");
    } finally {
      setBusy(false);
    }
  };

  const saveContent = async (status: GameContentStatus) => {
    if (!credentials || loadedDate !== date) return;
    setMessage("");
    setError("");
    const prompts = content.headlineRoulette;
    const cleanLines = (lines: string[]) => lines.map((line) => line.trim()).filter(Boolean);
    const parsed = gamesContentSchema.safeParse({
      ...content,
      headlineRoulette: {
        subjects: cleanLines(prompts.subjects),
        verbs: cleanLines(prompts.verbs),
        objects: cleanLines(prompts.objects),
        tails: cleanLines(prompts.tails),
      },
    });
    if (!parsed.success) {
      setError(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(" · "));
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/admin/games/${date}`, {
        method: "PUT",
        headers: {
          Authorization: authorizationHeader(credentials),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, content: parsed.data }),
      });
      const entry = await response.json() as GameDayEntry & { message?: string };
      if (!response.ok) {
        if (response.status === 401) logout();
        throw new Error(responseError(entry, response.status));
      }
      setPublishedAt(entry.published?.publishedAt ?? null);
      if (status === "published") {
        await queryClient.invalidateQueries({ queryKey: [API_ROUTES.GAMES_DAILY(date)] });
      }
      setMessage(status === "published" ? `Published the official games for ${date}.` : `Draft saved for ${date}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save game content");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <Link href={ROUTES.GAMES} className="text-sm font-bold uppercase tracking-wide text-primary hover:underline">
        ← All games
      </Link>
      <div className="mx-auto max-w-4xl">
        <h1 className="mt-2 mb-2 text-center font-quicksand text-3xl font-bold text-primary">Games Editorial Desk</h1>
        <p className="mb-6 text-center text-neutral-600">Prepare a dated game set, save a draft, then publish it for everyone.</p>

        {!credentials ? (
          <form onSubmit={login} className="mx-auto mb-8 max-w-xl border border-neutral-300 bg-neutral-50 p-5">
            <h2 className="mb-1 font-quicksand text-xl font-bold">Editor sign in</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass}>Puzzle date</span>
                <input className={fieldClass} type="date" value={date} onChange={(event) => setDate(event.currentTarget.value)} required />
              </label>
              <label>
                <span className={labelClass}>Username</span>
                <input className={fieldClass} autoComplete="username" maxLength={64} value={usernameInput} onChange={(event) => setUsernameInput(event.currentTarget.value)} required />
              </label>
              <label className="sm:col-span-2">
                <span className={labelClass}>Password</span>
                <input className={fieldClass} type="password" autoComplete="current-password" maxLength={128} value={passwordInput} onChange={(event) => setPasswordInput(event.currentTarget.value)} required />
              </label>
            </div>
            <button type="submit" disabled={busy || !date} className="mt-4 bg-primary px-5 py-2 font-bold text-white disabled:opacity-50">
              {busy ? "Signing in…" : "Sign in"}
            </button>
            {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
          </form>
        ) : (
          <>
            <section className="mb-8 grid gap-4 border border-neutral-300 bg-neutral-50 p-4 sm:grid-cols-2">
              <label>
                <span className={labelClass}>Puzzle date</span>
                <input className={fieldClass} type="date" value={date} onChange={(event) => setDate(event.currentTarget.value)} />
              </label>
              <div className="flex items-end gap-3">
                <button type="button" onClick={loadContent} disabled={busy || !date} className="border border-primary px-4 py-2 font-bold text-primary disabled:opacity-50">
                  Load saved content
                </button>
                <button type="button" onClick={logout} className="px-3 py-2 text-sm text-neutral-600 underline">
                  Sign out
                </button>
              </div>
              <span className="text-sm text-neutral-600 sm:col-span-2">
                {loadedDate !== date ? "Load saved content for this date before saving or publishing." : publishedAt ? `Published ${new Date(publishedAt).toLocaleString()}` : "Not published"}
              </span>
            </section>

        <section className="mb-8 border border-neutral-300 p-4">
          <h2 className="mb-3 font-quicksand text-xl font-bold">Toedle</h2>
          <label>
            <span className={labelClass}>Official five-letter answer</span>
            <input
              className={`${fieldClass} max-w-xs uppercase`}
              maxLength={5}
              value={content.toedle.answer}
              onChange={(event) => setContent({ ...content, toedle: { answer: event.currentTarget.value.toUpperCase() } })}
              placeholder="ENTER WORD"
            />
          </label>
          <p className="mt-2 text-xs text-neutral-500">The public game will use exactly this word for the selected date.</p>
        </section>

        <section className="mb-8 border border-neutral-300 p-4">
          <h2 className="mb-3 font-quicksand text-xl font-bold">Pinky Pairs / Connections</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {content.pairs.groups.map((group, groupIndex) => (
              <fieldset key={groupIndex} className="border border-neutral-200 p-3">
                <legend className="px-1 text-sm font-bold">Group {groupIndex + 1}</legend>
                <label>
                  <span className={labelClass}>Connection title</span>
                  <input className={fieldClass} value={group.title} onChange={(event) => {
                    const groups = [...content.pairs.groups];
                    groups[groupIndex] = { ...group, title: event.currentTarget.value };
                    setContent({ ...content, pairs: { groups } });
                  }} />
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {group.words.map((word, wordIndex) => (
                    <label key={wordIndex}>
                      <span className="sr-only">Group {groupIndex + 1}, word {wordIndex + 1}</span>
                      <input className={`${fieldClass} uppercase`} value={word} onChange={(event) => updatePairWord(groupIndex, wordIndex, event.currentTarget.value)} />
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <p className="mt-2 text-xs text-neutral-500">All 16 words must be unique.</p>
        </section>

        <section className="mb-8 border border-neutral-300 p-4">
          <h2 className="mb-3 font-quicksand text-xl font-bold">Patriarchy Bingo</h2>
          <p className="mb-3 text-sm text-neutral-600">Enter 24 unique squares. The center square is supplied as a free space.</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {content.bingo.squares.map((square, index) => (
              <label key={index}>
                <span className="sr-only">Bingo square {index + 1}</span>
                <input className={fieldClass} maxLength={120} value={square} onChange={(event) => updateBingoSquare(index, event.currentTarget.value)} />
              </label>
            ))}
          </div>
        </section>

        <section className="mb-8 border border-neutral-300 p-4">
          <h2 className="mb-3 font-quicksand text-xl font-bold">Headline Roulette</h2>
          <p className="mb-3 text-sm text-neutral-600">Add at least two options per list, one per line.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              ["subjects", "Who"],
              ["verbs", "Does what"],
              ["objects", "To what"],
              ["tails", "Subhead"],
            ] as const).map(([key, title]) => (
              <label key={key}>
                <span className={labelClass}>{title}</span>
                <textarea
                  className={fieldClass}
                  rows={6}
                  value={content.headlineRoulette[key].join("\n")}
                  onChange={(event) => {
                    const values = event.currentTarget.value.split(/\r?\n/);
                    setContent({ ...content, headlineRoulette: { ...content.headlineRoulette, [key]: values } });
                  }}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="mb-8 border border-neutral-300 p-4">
          <h2 className="mb-3 font-quicksand text-xl font-bold">Which Toe Are You?</h2>
          <div className="space-y-4">
            {content.toeQuiz.questions.map((question, questionIndex) => (
              <fieldset key={questionIndex} className="border border-neutral-200 p-3">
                <legend className="px-1 text-sm font-bold">Question {questionIndex + 1}</legend>
                <label>
                  <span className={labelClass}>Question</span>
                  <input className={fieldClass} value={question.q} onChange={(event) => {
                    const questions = [...content.toeQuiz.questions];
                    questions[questionIndex] = { ...question, q: event.currentTarget.value };
                    setContent({ ...content, toeQuiz: { questions } });
                  }} />
                </label>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {question.answers.map((answer, answerIndex) => (
                    <div key={answerIndex} className="flex gap-2">
                      <input
                        className={fieldClass}
                        aria-label={`Question ${questionIndex + 1}, answer ${answerIndex + 1}`}
                        value={answer.text}
                        onChange={(event) => {
                          const questions = [...content.toeQuiz.questions];
                          const answers = [...question.answers];
                          answers[answerIndex] = { ...answer, text: event.currentTarget.value };
                          questions[questionIndex] = { ...question, answers };
                          setContent({ ...content, toeQuiz: { questions } });
                        }}
                      />
                      <select
                        className="border border-neutral-300 bg-white px-2"
                        aria-label={`Result for question ${questionIndex + 1}, answer ${answerIndex + 1}`}
                        value={answer.toe}
                        onChange={(event) => {
                          const result = TOE_RESULTS.find((option) => option.id === event.currentTarget.value);
                          if (!result) return;
                          const questions = [...content.toeQuiz.questions];
                          const answers = [...question.answers];
                          answers[answerIndex] = { ...answer, toe: result.id };
                          questions[questionIndex] = { ...question, answers };
                          setContent({ ...content, toeQuiz: { questions } });
                        }}
                      >
                        {TOE_RESULTS.map((result) => <option key={result.id} value={result.id}>{result.name}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                {content.toeQuiz.questions.length > 1 && (
                  <button
                    type="button"
                    className="mt-3 text-sm text-red-700 underline"
                    onClick={() => setContent({ ...content, toeQuiz: { questions: content.toeQuiz.questions.filter((_, index) => index !== questionIndex) } })}
                  >
                    Remove question
                  </button>
                )}
              </fieldset>
            ))}
          </div>
          {content.toeQuiz.questions.length < 10 && (
            <button
              type="button"
              className="mt-3 border border-neutral-400 px-3 py-2 text-sm font-bold"
              onClick={() => setContent({
                ...content,
                toeQuiz: {
                  questions: [...content.toeQuiz.questions, {
                    q: "",
                    answers: [
                      { text: "", toe: "pinky" },
                      { text: "", toe: "big" },
                      { text: "", toe: "middle" },
                      { text: "", toe: "stubbed" },
                    ],
                  }],
                },
              })}
            >
              Add question
            </button>
          )}
        </section>

        <div className="sticky bottom-0 border-t border-neutral-300 bg-white p-4">
          {error && <p className="mb-3 text-sm font-bold text-red-700" role="alert">{error}</p>}
          {message && <p className="mb-3 text-sm font-bold text-primary" role="status">{message}</p>}
          <div className="flex flex-wrap justify-end gap-3">
            {loadedDate !== date && <p className="w-full text-sm text-neutral-700" role="status">Load saved content for the selected date before saving or publishing.</p>}
            <button type="button" onClick={() => saveContent("draft")} disabled={busy || !date || loadedDate !== date} className="border border-primary px-5 py-2 font-bold text-primary disabled:opacity-50">
              Save draft
            </button>
            <button type="button" onClick={() => saveContent("published")} disabled={busy || !date || loadedDate !== date} className="bg-primary px-5 py-2 font-bold text-white disabled:opacity-50">
              {busy ? "Saving…" : "Publish official games"}
            </button>
          </div>
        </div>
          </>
        )}
      </div>
    </Layout>
  );
}
