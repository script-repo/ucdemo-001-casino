import type { Metadata } from "next";
import Link from "next/link";
import { PlayerCmsDirectory } from "@/components/PlayerCmsDirectory";

export const metadata: Metadata = {
  title: "Player CMS",
  description: "Synthetic patron records for the casino AI portal.",
};

export default function CmsDirectoryPage() {
  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-6 py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-charcoal-700">
        <Link href="/" className="hover:text-navy-950">
          Dashboard
        </Link>
        <span className="px-2 text-gold-600" aria-hidden>
          /
        </span>
        <span className="text-charcoal-900">Player CMS</span>
      </nav>

      <header className="resort-panel px-6 py-6 sm:px-8">
        <p className="eyebrow">Source of record</p>
        <h1 className="mt-3 font-serif text-4xl text-navy-950">Player CMS</h1>
        <p className="mt-3 max-w-[70ch] leading-relaxed text-charcoal-700">
          Simulated SYNKROS-shaped patron records for this lab. Names, contact,
          host assignment, visits, and comps live here. AI applications recommend
          only; they do not own identity. Look up any player ID used in a queue,
          including churn, offers, and win-back.
        </p>
      </header>

      <PlayerCmsDirectory />
    </div>
  );
}
