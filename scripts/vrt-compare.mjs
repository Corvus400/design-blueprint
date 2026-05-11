import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import sharp from "sharp";
import {
  PIXELMATCH_THRESHOLD,
  REPORT_DIR,
  actualPath,
  diffPath,
  listProjects,
  loadPages,
  snapshotPath,
} from "./vrt-config.mjs";

async function loadPng(file) {
  const buf = await readFile(file);
  return PNG.sync.read(buf);
}

async function normalizePng(file, width, height) {
  const buf = await sharp(file).resize(width, height, { fit: "fill" }).png().toBuffer();
  return PNG.sync.read(buf);
}

export async function compareProject(project) {
  const pages = await loadPages(project);
  const results = [];
  await mkdir(REPORT_DIR, { recursive: true });
  for (const page of pages) {
    const baselineFile = snapshotPath(project, page.name);
    const actualFile = actualPath(project, page.name);
    if (!existsSync(actualFile)) {
      throw new Error(`actual not found for ${project}/${page.name}: ${actualFile}`);
    }
    if (!existsSync(baselineFile)) {
      results.push({
        type: "new",
        project,
        page: page.name,
        golden_file_path: path.relative(process.cwd(), baselineFile),
        actual_file_path: path.relative(process.cwd(), actualFile),
        diff_file_path: null,
        compare_file_path: null,
        diff_percentage: null,
        spec_path: path.join(project, "spec.md"),
        ai_assertion_results: null,
        timestamp: Date.now(),
      });
      continue;
    }

    const baseline = await loadPng(baselineFile);
    const actual =
      baseline.width === (await sharp(actualFile).metadata()).width &&
      baseline.height === (await sharp(actualFile).metadata()).height
        ? await loadPng(actualFile)
        : await normalizePng(actualFile, baseline.width, baseline.height);
    const diffPng = new PNG({ width: baseline.width, height: baseline.height });
    const diffPixels = pixelmatch(baseline.data, actual.data, diffPng.data, baseline.width, baseline.height, {
      threshold: PIXELMATCH_THRESHOLD,
      includeAA: false,
    });
    const total = baseline.width * baseline.height;
    const diffPercentage = diffPixels / total;
    const diffOut = diffPath(project, page.name);
    await mkdir(path.dirname(diffOut), { recursive: true });
    await writeFile(diffOut, PNG.sync.write(diffPng));
    const type = diffPercentage > page.threshold ? "changed" : "unchanged";
    results.push({
      type,
      project,
      page: page.name,
      golden_file_path: path.relative(process.cwd(), baselineFile),
      actual_file_path: path.relative(process.cwd(), actualFile),
      diff_file_path: path.relative(process.cwd(), diffOut),
      compare_file_path: null,
      diff_percentage: Number(diffPercentage.toFixed(6)),
      spec_path: path.join(project, "spec.md"),
      ai_assertion_results: null,
      timestamp: Date.now(),
    });
  }
  return results;
}

export async function compareProjects(projects) {
  const all = [];
  for (const project of projects) {
    all.push(...(await compareProject(project)));
  }
  return all;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--project");
  let projects;
  if (idx >= 0 && args[idx + 1]) {
    projects = [args[idx + 1]];
  } else if (args.includes("--all")) {
    projects = await listProjects();
  } else {
    console.error("Usage: vrt-compare.mjs --project <name> | --all");
    process.exit(2);
  }
  const results = await compareProjects(projects);
  const intermediate = path.join(REPORT_DIR, ".intermediate.json");
  await writeFile(intermediate, JSON.stringify(results, null, 2));
  console.log(`[vrt-compare] wrote ${intermediate} with ${results.length} results`);
}
