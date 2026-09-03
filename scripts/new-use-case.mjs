#!/usr/bin/env node
/**
 * Scaffold a new use case from use-cases/_template.
 *
 *   npm run new:use-case incident-triage
 *   npm run new:use-case incident-triage -- --title "Incident Triage"
 */

import { cp, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(import.meta.dirname, "..");
const TEMPLATE_DIR = path.join(ROOT, "use-cases", "_template");
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function fail(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

function titleCase(slug) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const args = process.argv.slice(2);
const slug = args.find((arg) => !arg.startsWith("--"));
const titleIndex = args.indexOf("--title");
const title =
  titleIndex !== -1 && args[titleIndex + 1]
    ? args[titleIndex + 1]
    : slug && titleCase(slug);

if (!slug) {
  fail("Usage: npm run new:use-case <slug> [-- --title \"Display Name\"]");
}
if (!SLUG_PATTERN.test(slug)) {
  fail(`Invalid slug "${slug}". Use lowercase words separated by hyphens.`);
}

const target = path.join(ROOT, "use-cases", slug);
if (existsSync(target)) {
  fail(`use-cases/${slug} already exists.`);
}

const envPrefix = slug.toUpperCase().replaceAll("-", "_");

await cp(TEMPLATE_DIR, target, { recursive: true });

for await (const file of walk(target)) {
  const original = await readFile(file, "utf8");
  const rendered = original
    .replaceAll("__ENV_PREFIX__", envPrefix)
    .replaceAll("__SLUG__", slug)
    .replaceAll("__TITLE__", title);

  if (rendered !== original) await writeFile(file, rendered);
}

// The template manifest resolves its schema one level up; that still holds.
const manifestPath = path.join(target, "usecase.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
manifest.slug = slug;
manifest.title = title;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

// Windows cannot have a file named `.env.example` copied under some shells;
// normalise the name if the copy landed differently.
const envExample = path.join(target, ".env.example");
const strayEnv = path.join(target, "env.example");
if (!existsSync(envExample) && existsSync(strayEnv)) {
  await rename(strayEnv, envExample);
}

console.log(`
  Created use-cases/${slug}

  Next:
    1. Edit use-cases/${slug}/usecase.json (summary, owner, resources)
    2. Build the UI in use-cases/${slug}/web/Page.tsx
    3. Keep or delete use-cases/${slug}/api/ and deploy/
    4. npm run validate && npm run dev

  It will appear on the dashboard at /use-cases/${slug} with no portal changes.
`);
