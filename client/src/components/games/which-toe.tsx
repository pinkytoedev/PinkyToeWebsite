import { useEffect, useState } from "react";
import { TOE_RESULTS } from "@/lib/games-satire";
import { DailyGameNotice, useDailyGames } from "./daily-game";

export function WhichToe() {
  const { data: daily, isLoading, error } = useDailyGames();
  const quiz = daily?.content?.toeQuiz.questions;
  const [step, setStep] = useState(0);
  const [tally, setTally] = useState<Record<string, number>>({});

  const done = Boolean(quiz && step >= quiz.length);

  useEffect(() => {
    setStep(0);
    setTally({});
  }, [daily?.publishedAt]);

  const answer = (toe: string) => {
    setTally((t) => ({ ...t, [toe]: (t[toe] ?? 0) + 1 }));
    setStep((s) => s + 1);
  };

  const reset = () => {
    setStep(0);
    setTally({});
  };

  if (!quiz) {
    return <DailyGameNotice game="Which Toe Are You?" isLoading={isLoading} error={error} />;
  }

  if (done) {
    const top = [...TOE_RESULTS].sort((a, b) => (tally[b.id] ?? 0) - (tally[a.id] ?? 0))[0];
    return (
      <div className="mx-auto max-w-md text-center bg-white border border-neutral-300 p-6">
        <p className="text-sm uppercase tracking-widest text-neutral-500">You are</p>
        <div className="text-6xl my-2">{top.emoji}</div>
        <h2 className="font-quicksand font-bold text-3xl text-primary">{top.name}</h2>
        <p className="mt-3 text-neutral-700">{top.blurb}</p>
        <button onClick={reset} className="mt-6 bg-primary text-white font-bold px-6 py-2 hover:bg-pinky-dark transition-colors">
          Take it again
        </button>
      </div>
    );
  }

  const q = quiz[step];
  return (
    <div className="mx-auto max-w-md">
      <p className="text-xs uppercase tracking-widest text-neutral-500 text-center mb-2">
        Question {step + 1} of {quiz.length}
      </p>
      <h2 className="font-quicksand font-bold text-xl text-center mb-4">{q.q}</h2>
      <div className="space-y-2">
        {q.answers.map((a) => (
          <button
            key={a.text}
            onClick={() => answer(a.toe)}
            className="w-full text-left bg-white border-2 border-neutral-300 hover:border-primary px-4 py-3 transition-colors"
          >
            {a.text}
          </button>
        ))}
      </div>
    </div>
  );
}
