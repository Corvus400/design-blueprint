import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const REPO_ROOT = process.cwd();
export const OUTPUT_DIR = path.join(REPO_ROOT, ".vrt-output");
export const REPORT_DIR = path.join(OUTPUT_DIR, "report");
export const ACTUAL_DIR = path.join(OUTPUT_DIR, "actual");
export const DIFF_DIR = path.join(OUTPUT_DIR, "diff");
export const COMPARISON_DIR = path.join(OUTPUT_DIR, "comparison");

export const EXCLUDED_DIRS = new Set([
  "node_modules",
  "scripts",
  ".husky",
  ".vrt-output",
  ".git",
  ".github",
  ".idea",
  ".vscode",
]);

export const DEFAULT_VIEWPORT = { width: 1280, height: 800 };
export const DEFAULT_DEVICE_SCALE_FACTOR = 1;
export const DEFAULT_THRESHOLD = 0.1;
export const PAGE_GOTO_TIMEOUT_MS = 5000;
export const PIXELMATCH_THRESHOLD = 0.1;

export async function listProjects() {
  const entries = await readdir(REPO_ROOT, { withFileTypes: true });
  const projects = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith(".")) continue;
    const pagesPath = path.join(REPO_ROOT, entry.name, "pages.json");
    if (existsSync(pagesPath)) projects.push(entry.name);
  }
  return projects.sort();
}

export async function loadPages(project) {
  const pagesPath = path.join(REPO_ROOT, project, "pages.json");
  const raw = await readFile(pagesPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.pages)) {
    throw new Error(`pages.json for ${project} must have a top-level "pages" array`);
  }
  return parsed.pages.map((page) => {
    if (!page.name) throw new Error(`pages.json for ${project} contains a page without "name"`);
    return {
      name: page.name,
      file: page.file ?? page.path ?? `${page.name}.html`,
      viewport: { ...DEFAULT_VIEWPORT, ...(page.viewport ?? {}) },
      deviceScaleFactor: page.deviceScaleFactor ?? DEFAULT_DEVICE_SCALE_FACTOR,
      threshold: page.threshold ?? DEFAULT_THRESHOLD,
      mask: page.mask ?? [],
    };
  });
}

export function snapshotPath(project, pageName) {
  return path.join(REPO_ROOT, project, "snapshots", "chromium", `${pageName}.png`);
}

export function actualPath(project, pageName) {
  return path.join(ACTUAL_DIR, project, `${pageName}.png`);
}

export function diffPath(project, pageName) {
  return path.join(DIFF_DIR, project, `${pageName}.png`);
}

export function comparisonPath(project, pageName) {
  return path.join(COMPARISON_DIR, project, `${pageName}.png`);
}
