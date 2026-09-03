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
      <nav aria-label="Breadcrumb" className="text-xs text-fog-500">
        <Link href="/" className="hover:text-ivory-100">
          Dashboard
        </Link>
        <span className="px-2" aria-hidden>
          /
        </span>
        <span className="text-fog-300">Shared resources</span>
      </nav>

      <section>
        <div className="gold-rule" aria-hidden />
        <h1 className="mt-4 font-serif text-3xl text-ivory-100">
          Shared resources
        </h1>
        <p className="mt-3 max-w-[70ch] leading-relaxed text-fog-300">
          Infrastructure every application may depend on. Configuration is
          supplied by the environment; only whether a variable is set is ever
          displayed, never its value. Reference documentation for each resource
          lives under{" "}
          <code className="font-mono text-sm text-ivory-100">
            shared-resources/
          </code>
          .
        </p>
        <p className="tabular mt-4 text-xs text-fog-500">
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
