"use client";

import type { TaskId } from "../types";

const TASKS: {
  id: TaskId;
  title: string;
  description: string;
  audience: string;
}[] = [
  {
    id: "host",
    title: "Prepare a player conversation",
    description: "Look up one player’s expected value and the reasons behind it.",
    audience: "Host",
  },
  {
    id: "prioritize",
    title: "Find players to prioritize",
    description: "Build a filtered cohort, review rising value, and export for reinvestment.",
    audience: "Player development",
  },
  {
    id: "quality",
    title: "Review prediction quality",
    description: "Check whether estimates match observed outcomes by player group.",
    audience: "Analyst",
  },
  {
    id: "health",
    title: "Check system health",
    description: "Confirm scoring freshness, pipeline stages, and coverage.",
    audience: "Operator",
  },
];

export function TaskPicker({
  active,
  onSelect,
}: {
  active: TaskId | null;
  onSelect: (id: TaskId) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal-700">
        What are you trying to do?
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {TASKS.map((task) => {
          const selected = active === task.id;
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => onSelect(task.id)}
              className={`rounded-lg border p-4 text-left transition-colors ${
                selected
                  ? "border-navy-900 bg-navy-900 text-ivory-100"
                  : "border-stone-200 bg-white text-charcoal-900 hover:border-navy-700 hover:bg-mist-100"
              }`}
            >
              <span
                className={`text-[11px] font-semibold uppercase tracking-wide ${
                  selected ? "text-gold-300" : "text-charcoal-700"
                }`}
              >
                {task.audience}
              </span>
              <span className="mt-2 block font-serif text-lg leading-snug">
                {task.title}
              </span>
              <span
                className={`mt-2 block text-sm leading-relaxed ${
                  selected ? "text-fog-300" : "text-charcoal-700"
                }`}
              >
                {task.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
