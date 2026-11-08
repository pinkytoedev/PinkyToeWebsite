import type { Stats } from "@/lib/games";

export function StatsBar({ stats }: { stats: Stats }) {
  const pct = stats.played ? Math.round((stats.wins / stats.played) * 100) : 0;
  const items = [
    ["Played", stats.played],
    ["Win %", pct],
    ["Streak", stats.streak],
    ["Best", stats.best],
  ] as const;
  return (
    <dl className="grid grid-cols-4 text-center border-t border-neutral-200 mt-6 pt-4">
      {items.map(([label, value]) => (
        <div key={label}>
          <dd className="text-2xl font-bold">{value}</dd>
          <dt className="text-xs uppercase tracking-wide text-neutral-500">{label}</dt>
        </div>
      ))}
    </dl>
  );
}
