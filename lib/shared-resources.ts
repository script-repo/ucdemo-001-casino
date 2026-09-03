import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { getStoredSettingNames } from "@/lib/kubernetes-settings";
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
export function statusFor(
  resource: SharedResource,
  storedNames: Set<string> = new Set(),
): SharedResourceStatus {
  const environmentVariables = resource.env
    .filter((variable) => Boolean(process.env[variable.name]))
    .map((variable) => variable.name);
  const storedVariables = resource.env
    .filter((variable) => storedNames.has(variable.name))
    .map((variable) => variable.name);
  const configuredNames = new Set([
    ...environmentVariables,
    ...storedVariables,
  ]);
  const missing = resource.env
    .filter(
      (variable) => variable.required && !configuredNames.has(variable.name),
    )
    .map((variable) => variable.name);

  return {
    resource,
    configured: missing.length === 0,
    missing,
    environmentVariables,
    storedVariables,
  };
}

export async function getResourceStatuses(): Promise<SharedResourceStatus[]> {
  const resources = await getSharedResources();
  let storedNames = new Set<string>();
  try {
    storedNames = await getStoredSettingNames();
  } catch (error) {
    console.error("Could not inspect Kubernetes shared-resource settings.", error);
  }
  return resources.map((resource) => statusFor(resource, storedNames));
}
