import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import type { SharedResource, SharedResourceStatus } from "@/lib/types";

export const RESOURCES_FILE = path.join(
  process.cwd(),
  "shared-resources",
  "resources.json",
);

export const getSharedResources = cache(async (): Promise<SharedResource[]> => {
  const raw = await readFile(RESOURCES_FILE, "utf8");
  return (JSON.parse(raw) as { resources: SharedResource[] }).resources;
});

/**
 * Reports which required variables are absent. Values are never read, so a
 * secret cannot leak into the rendered page.
 */
export function statusFor(resource: SharedResource): SharedResourceStatus {
  const missing = resource.env
    .filter((variable) => variable.required && !process.env[variable.name])
    .map((variable) => variable.name);

  return { resource, configured: missing.length === 0, missing };
}

export const getResourceStatuses = cache(
  async (): Promise<SharedResourceStatus[]> => {
    const resources = await getSharedResources();
    return resources.map(statusFor);
  },
);
