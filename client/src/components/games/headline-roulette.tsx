import { useEffect, useMemo, useState } from "react";
import { DailyGameNotice, useDailyGames } from "./daily-game";

const roll = (lists: readonly string[][]) => lists.map((list) => Math.floor(Math.random() * list.length));

export function HeadlineRoulette() {
  const { data: daily, isLoading, error } = useDailyGames();
  const [idx, setIdx] = useState<number[] | null>(null);
  const [locked, setLocked] = useState<boolean[]>([false, false, false, false]);
  const [copied, setCopied] = useState(false);

  const lists = useMemo(() => {
    const prompts = daily?.content?.headlineRoulette;
    return prompts ? [prompts.subjects, prompts.verbs, prompts.objects, prompts.tails] : [];
  }, [daily?.publishedAt]);
  const starterIndices = useMemo(() => roll(lists), [lists]);
  useEffect(() => {
    setIdx(null);
    setLocked([false, false, false, false]);
  }, [daily?.publishedAt]);

  const indices = idx && idx.length === lists.length && idx.every((value, i) => value < lists[i].length)
    ? idx
    : starterIndices;
  const parts = indices.map((n, i) => lists[i]?.[n] ?? "");
  const headline = `${parts[0]} ${parts[1]} ${parts[2]}`;

  const spin = () => {
    const fresh = roll(lists);
    setIdx(indices.map((n, i) => (locked[i] ? n : fresh[i])));
    setCopied(false);
  };

  const copy = () => {
    if (parts.length !== 4) return;
    navigator.clipboard?.writeText(`${headline}\n${parts[3]}\n— The Pinky Toe Headline Roulette`).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  if (!daily?.content?.headlineRoulette) {
    return <DailyGameNotice game="Headline Roulette" isLoading={isLoading} error={error} />;
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-center text-sm text-neutral-600 mb-4">
        Spin a satirical headline. Lock the parts you love and re-spin the rest.
      </p>

      <article className="bg-white border border-neutral-300 p-6 text-center mb-4">
        <h2 className="font-quicksand font-bold text-2xl sm:text-3xl text-primary leading-tight">{headline}</h2>
        <p className="mt-3 italic text-neutral-600">{parts[3]}</p>
      </article>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {["Who", "Does what", "To what", "Subhead"].map((label, i) => (
          <button
            key={label}
            onClick={() => setLocked((l) => l.map((v, j) => (j === i ? !v : v)))}
            aria-pressed={locked[i]}
            className={`px-3 py-2 text-sm font-bold border-2 transition-colors ${
              locked[i] ? "bg-neutral-800 text-white border-neutral-800" : "bg-white border-neutral-300 hover:border-primary"
            }`}
          >
            {locked[i] ? "🔒" : "🔓"} {label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 justify-center">
        <button onClick={spin} className="bg-primary text-white font-bold px-6 py-2 hover:bg-pinky-dark transition-colors">
          Spin
        </button>
        <button onClick={copy} className="border-2 border-primary text-primary font-bold px-6 py-2 hover:bg-pink-50">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
