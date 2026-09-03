"use client";

import type { Driver } from "../types";
import { money } from "../format";

export function DriverBars({ drivers }: { drivers: Driver[] }) {
  if (drivers.length === 0) {
    return (
      <p className="text-sm text-charcoal-700">
        No driver contributions are available for this player.
      </p>
    );
  }

  const max = Math.max(...drivers.map((d) => Math.abs(d.contribution)), 1);
  const up = drivers.filter((d) => d.direction === "up");
  const down = drivers.filter((d) => d.direction === "down");

  return (
    <div className="space-y-5">
      <p className="text-xs text-charcoal-700">
        Compared with players who have similar activity histories. Factors are
        associated with the estimate — they do not prove causation.
      </p>
      <DriverGroup title="Associated with a higher estimate" items={up} max={max} />
      <DriverGroup title="Associated with a lower estimate" items={down} max={max} />
    </div>
  );
}

function DriverGroup({
  title,
  items,
  max,
}: {
  title: string;
  items: Driver[];
  max: number;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-charcoal-700">
        {title}
      </h4>
      <ul className="mt-3 space-y-3">
        {items.map((d) => {
          const width = Math.max(8, (Math.abs(d.contribution) / max) * 100);
          const positive = d.direction === "up";
          return (
            <li key={d.feature}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-charcoal-900">{d.text}</span>
                <span className="tabular shrink-0 font-medium text-charcoal-900">
                  {positive ? "+" : "−"}
                  {money(Math.abs(d.contribution))}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-mist-100">
                <div
                  className={`h-full rounded-full ${positive ? "bg-success" : "bg-burgundy-500"}`}
                  style={{ width: `${width}%` }}
                  aria-hidden
                />
              </div>
              <p className="mt-1 text-xs text-charcoal-700">{d.period}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
