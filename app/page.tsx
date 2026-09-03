import { DashboardShell } from "@/components/DashboardShell";
import { getResourceStatuses } from "@/lib/shared-resources";
import { getUseCases } from "@/lib/use-cases";

// Resource readiness reflects environment variables supplied at runtime, so this
// page must not be prerendered at build time.
export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ q?: string }> };

export default async function DashboardPage({ searchParams }: PageProps) {
  const [{ q }, useCases, resourceStatuses] = await Promise.all([
    searchParams,
    getUseCases(),
    getResourceStatuses(),
  ]);

  return (
    <DashboardShell
      useCases={useCases}
      resourcesConfigured={
        resourceStatuses.filter((status) => status.configured).length
      }
      resourcesTotal={resourceStatuses.length}
      initialQuery={q ?? ""}
    />
  );
}
