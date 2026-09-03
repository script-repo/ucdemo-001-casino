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

  const configured = resourceStatuses.filter((status) => status.configured);

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
          supplied by the deployment or saved to the namespace Secret. Values
          are write-only: this page displays their source and status, never the
          value. Reference documentation for each resource lives under{" "}
          <code className="font-mono text-sm text-navy-900">
            shared-resources/
          </code>
          .
        </p>
        <p className="tabular mt-4 text-xs text-charcoal-700">
          {configured.length} of {resourceStatuses.length} configured in this
          environment
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
