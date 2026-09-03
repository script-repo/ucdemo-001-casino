import type { UseCaseStatus } from "@/lib/types";

/**
 * Section 4.2 semantic colours, carried by the dot rather than the text. The
 * label stays ivory so it clears 4.5:1 on the tinted pill, and the colour is
 * always paired with a word — never colour alone (section 16.1).
 */
const STYLES: Record<UseCaseStatus, { dot: string; tint: string; label: string }> =
  {
    active: { dot: "bg-success", tint: "bg-success/15", label: "Active" },
    beta: { dot: "bg-information", tint: "bg-information/15", label: "Beta" },
    planned: {
      dot: "bg-fog-500",
      tint: "bg-fog-500/15",
      label: "Planned",
    },
    retired: {
      dot: "bg-critical",
      tint: "bg-critical/15",
      label: "Retired",
    },
  };

export function StatusBadge({ status }: { status: UseCaseStatus }) {
  const style = STYLES[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-ivory-100 ${style.tint}`}
    >
      <span className={`size-1.5 rounded-full ${style.dot}`} aria-hidden />
      {style.label}
    </span>
  );
}
