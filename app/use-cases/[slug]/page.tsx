import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { getSharedResources } from "@/lib/shared-resources";
import { getUseCase } from "@/lib/use-cases";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const useCase = await getUseCase(slug);
  return useCase
    ? { title: useCase.title, description: useCase.summary }
    : { title: "Not found" };
}

export default async function UseCasePage({ params }: PageProps) {
  const { slug } = await params;

  // Resolving through the registry first means only known slugs ever reach the
  // import below.
  const useCase = await getUseCase(slug);
  if (!useCase) notFound();

  const resources = await getSharedResources();
  const resourceNames = Object.fromEntries(
    resources.map((resource) => [resource.id, resource.name]),
  );

  let View: ComponentType | null = null;
  try {
    const mod = await import(`../../../use-cases/${slug}/web/Page`);
    View = mod.default as ComponentType;
  } catch {
    View = null;
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-8 px-6 py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-fog-500">
        <Link href="/" className="hover:text-ivory-100">
          Dashboard
        </Link>
        <span className="px-2" aria-hidden>
          /
        </span>
        <span className="text-fog-300">{useCase.title}</span>
      </nav>

      <header className="border-b border-hairline pb-6">
        <div className="gold-rule" aria-hidden />
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <h1 className="font-serif text-3xl text-ivory-100">
            {useCase.title}
          </h1>
          <StatusBadge status={useCase.status} />
        </div>
        <p className="mt-3 max-w-[70ch] leading-relaxed text-fog-300">
          {useCase.summary}
        </p>

        {/* Section 35.3 — owner, scope, and source visible on operational surfaces. */}
        <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-3 text-xs">
          <div>
            <dt className="font-semibold uppercase tracking-[0.12em] text-fog-500">
              Owner
            </dt>
            <dd className="mt-1 text-ivory-100">{useCase.owner}</dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-[0.12em] text-fog-500">
              Category
            </dt>
            <dd className="mt-1 text-ivory-100">
              {useCase.category ?? "Uncategorised"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-[0.12em] text-fog-500">
              Shared resources
            </dt>
            <dd className="mt-1 text-ivory-100">
              {useCase.resources.length > 0
                ? useCase.resources
                    .map((id) => resourceNames[id] ?? id)
                    .join(", ")
                : "None"}
            </dd>
          </div>
        </dl>
      </header>

      {View ? (
        <View />
      ) : (
        <div className="rounded-lg border border-dashed border-hairline bg-ink-850 p-10 text-center">
          <p className="font-serif text-lg text-ivory-100">
            No interface published
          </p>
          <p className="mx-auto mt-2 max-w-[55ch] text-sm text-fog-300">
            This application is registered but has no UI yet. Add a
            default-exported React component at{" "}
            <code className="font-mono text-xs">
              use-cases/{slug}/web/Page.tsx
            </code>
            .
          </p>
        </div>
      )}
    </div>
  );
}
