#!/usr/bin/env node
/**
 * Checks every use case against the structural contract:
 *
 *   - usecase.json parses and carries the required fields
 *   - slug matches the folder name
 *   - declared resources exist in shared-resources/resources.json
 *   - web/Page.tsx exists, and api/main.py exists when api.enabled is true
 *   - nothing imports across use-case boundaries or from the portal shell
 *
 * Run with `npm run validate`. Exits non-zero on any error.
 */

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(import.meta.dirname, "..");
const USE_CASES_DIR = path.join(ROOT, "use-cases");
const RESOURCES_FILE = path.join(ROOT, "shared-resources", "resources.json");

const REQUIRED_FIELDS = [
  "slug",
  "title",
  "summary",
  "status",
  "owner",
  "tags",
  "resources",
];
const STATUSES = ["active", "beta", "planned", "retired"];
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

const IMPORT_PATTERNS = [
  /\bfrom\s+["']([^"']+)["']/g,
  /\bimport\s+["']([^"']+)["']/g,
  /\bimport\(\s*["']([^"']+)["']\s*\)/g,
  /\brequire\(\s*["']([^"']+)["']\s*\)/g,
];

const errors = [];
const warnings = [];

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".venv") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

function escapesFolder(fromFile, specifier, folder) {
  const resolved = path.resolve(path.dirname(fromFile), specifier);
  const relative = path.relative(folder, resolved);
  return relative.startsWith("..") || path.isAbsolute(relative);
}

async function checkImports(slug, folder) {
  for await (const file of walk(folder)) {
    if (!CODE_EXTENSIONS.has(path.extname(file))) continue;

    const source = await readFile(file, "utf8");
    const shown = path.relative(ROOT, file).replaceAll("\\", "/");

    for (const pattern of IMPORT_PATTERNS) {
      for (const [, specifier] of source.matchAll(pattern)) {
        if (specifier.startsWith("@/")) {
          errors.push(
            `${shown}: imports "${specifier}". The @/ alias reaches the portal shell; use cases may only import from their own folder.`,
          );
        } else if (
          (specifier.startsWith("./") || specifier.startsWith("../")) &&
          escapesFolder(file, specifier, folder)
        ) {
          errors.push(
            `${shown}: imports "${specifier}", which resolves outside use-cases/${slug}. Copy what you need into this folder instead.`,
          );
        }
      }
    }
  }
}

const catalogue = JSON.parse(await readFile(RESOURCES_FILE, "utf8"));
const resourceIds = new Set(catalogue.resources.map((resource) => resource.id));

for (const resource of catalogue.resources) {
  if (!existsSync(path.join(ROOT, "shared-resources", resource.id))) {
    warnings.push(
      `shared-resources/${resource.id}/ is missing, but resources.json declares it.`,
    );
  }
}

const entries = await readdir(USE_CASES_DIR, { withFileTypes: true });
const slugs = entries
  .filter(
    (entry) =>
      entry.isDirectory() &&
      !entry.name.startsWith("_") &&
      !entry.name.startsWith("."),
  )
  .map((entry) => entry.name);

for (const slug of slugs) {
  const folder = path.join(USE_CASES_DIR, slug);
  const manifestPath = path.join(folder, "usecase.json");

  if (!existsSync(manifestPath)) {
    errors.push(`use-cases/${slug}: missing usecase.json.`);
    continue;
  }

  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    errors.push(`use-cases/${slug}/usecase.json: invalid JSON — ${error.message}`);
    continue;
  }

  for (const field of REQUIRED_FIELDS) {
    if (manifest[field] === undefined) {
      errors.push(`use-cases/${slug}/usecase.json: missing "${field}".`);
    }
  }

  if (manifest.slug !== slug) {
    errors.push(
      `use-cases/${slug}/usecase.json: slug is "${manifest.slug}" but the folder is "${slug}".`,
    );
  }

  if (manifest.status && !STATUSES.includes(manifest.status)) {
    errors.push(
      `use-cases/${slug}/usecase.json: status "${manifest.status}" is not one of ${STATUSES.join(", ")}.`,
    );
  }

  for (const id of manifest.resources ?? []) {
    if (!resourceIds.has(id)) {
      errors.push(
        `use-cases/${slug}/usecase.json: unknown resource "${id}". Valid ids: ${[...resourceIds].join(", ")}.`,
      );
    }
  }

  if (!existsSync(path.join(folder, "web", "Page.tsx"))) {
    errors.push(
      `use-cases/${slug}: missing web/Page.tsx, so /use-cases/${slug} has nothing to render.`,
    );
  }

  if (manifest.api?.enabled && !existsSync(path.join(folder, "api", "main.py"))) {
    errors.push(
      `use-cases/${slug}: api.enabled is true but api/main.py does not exist.`,
    );
  }

  if (!existsSync(path.join(folder, "README.md"))) {
    warnings.push(`use-cases/${slug}: no README.md.`);
  }

  await checkImports(slug, folder);
}

for (const warning of warnings) console.warn(`  warn   ${warning}`);
for (const error of errors) console.error(`  error  ${error}`);

if (errors.length > 0) {
  console.error(`\n  ${errors.length} error(s) across ${slugs.length} use case(s).\n`);
  process.exit(1);
}

console.log(
  `\n  ${slugs.length} use case(s) valid${warnings.length ? `, ${warnings.length} warning(s)` : ""}.\n`,
);
