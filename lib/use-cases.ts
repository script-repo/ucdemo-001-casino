import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import type { UseCaseManifest } from "@/lib/types";

export const USE_CASES_DIR = path.join(process.cwd(), "use-cases");

const STATUS_ORDER = ["active", "beta", "planned", "retired"];

/** Folders prefixed with `_` or `.` are scaffolding, not use cases. */
function isUseCaseFolder(name: string): boolean {
  return !name.startsWith("_") && !name.startsWith(".");
}

async function readManifest(slug: string): Promise<UseCaseManifest | null> {
  try {
    const raw = await readFile(
      path.join(USE_CASES_DIR, slug, "usecase.json"),
      "utf8",
    );
    return { ...(JSON.parse(raw) as UseCaseManifest), slug };
  } catch {
    return null;
  }
}

export const getUseCases = cache(async (): Promise<UseCaseManifest[]> => {
  const entries = await readdir(USE_CASES_DIR, { withFileTypes: true });
  const slugs = entries
    .filter((entry) => entry.isDirectory() && isUseCaseFolder(entry.name))
    .map((entry) => entry.name);

  const manifests = await Promise.all(slugs.map(readManifest));

  return manifests
    .filter((manifest): manifest is UseCaseManifest => manifest !== null)
    .sort((a, b) => {
      const byStatus =
        STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      return byStatus !== 0 ? byStatus : a.title.localeCompare(b.title);
    });
});

export const getUseCase = cache(
  async (slug: string): Promise<UseCaseManifest | null> => {
    const useCases = await getUseCases();
    return useCases.find((useCase) => useCase.slug === slug) ?? null;
  },
);
