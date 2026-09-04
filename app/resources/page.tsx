import type { Metadata } from "next";
import Link from "next/link";
import { ResourceCard } from "@/components/ResourceCard";
import { getResourceStatuses } from "@/lib/shared-resources";
import { getUseCases } from "@/lib/use-cases";

export const metadata: Metadata = { title: "Shared resources" };

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const [useCases, resourceStatuses] = await Promise.all([
    getUseCases(),
    getResourceStatuses(),
  ]);

  return (
    <div className="mx-auto max-w-[1100px] space-y-8 px-6 py-10">
      {/* Section 10.5 — breadcrumbs below the header for pages deeper than two levels. */}
      <nav aria-label="Breadcrumb" className="text-xs text-charcoal-700">
        <Link href="/" className="hover:text-navy-900">
          Dashboard
        </Link>
        <span className="px-2" aria-hidden>
          /
        </span>
        <span className="text-charcoal-700">Shared resources</span>
      </nav>

      <section>
        <div className="gold-rule" aria-hidden />
        <h1 className="mt-4 font-serif text-3xl text-navy-900">
          Shared resources
        </h1>
        <p className="mt-3 max-w-[70ch] leading-relaxed text-charcoal-700">
          Infrastructure every application may depend on. Configuration is
          saved only in the current browser. Keys are never persisted by the
          portal server or Kubernetes. Reference documentation for each resource lives under{" "}
          <code className="font-mono text-sm text-navy-900">
            shared-resources/
          </code>
          .
        </p>
        <p className="mt-4 text-xs text-charcoal-700">
          Configuration is specific to this browser profile and device.
        </p>
      </section>

      <div className="grid gap-5">
        {resourceStatuses.map((status) => (
          <ResourceCard
            key={status.resource.id}
            status={status}
            showEnv
            consumers={useCases
              .filter((useCase) =>
                useCase.resources.includes(status.resource.id),
              )
              .map((useCase) => useCase.title)}
          />
        ))}
      </div>
    </div>
  );
}
