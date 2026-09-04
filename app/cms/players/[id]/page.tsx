import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayerCmsRecord } from "@/components/PlayerCmsRecord";
import { getPatron } from "@/lib/player-cms";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const patron = getPatron(Number(id));
  return patron
    ? { title: `${patron.displayName} · Player CMS` }
    : { title: "Player not found" };
}

export default async function CmsPlayerPage({ params }: PageProps) {
  const { id } = await params;
  const patron = getPatron(Number(id));
  if (!patron) notFound();

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-6 py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-charcoal-700">
        <Link href="/" className="hover:text-navy-950">
          Dashboard
        </Link>
        <span className="px-2 text-gold-600" aria-hidden>
          /
        </span>
        <Link href="/cms" className="hover:text-navy-950">
          Player CMS
        </Link>
        <span className="px-2 text-gold-600" aria-hidden>
          /
        </span>
        <span className="text-charcoal-900">{patron.displayName}</span>
      </nav>

      <PlayerCmsRecord patron={patron} />
    </div>
  );
}
