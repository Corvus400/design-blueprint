import path from "node:path";
import { REPO_ROOT, loadPages, listProjects } from "./vrt-config.mjs";
import { stagedFiles } from "./git-utils.mjs";
import { captureVisualManifest } from "./visual-review-manifest.mjs";

function parseArgs(argv) {
  const options = { mode: null };
  for (const arg of argv) {
    if (arg === "--staged") options.mode = "staged";
    else if (arg === "--all") options.mode = "all";
  }
  if (!options.mode) throw new Error("Usage: visual-review-hook.mjs --staged | --all");
  return options;
}

async function visualPagesForProjects(projects) {
  const out = [];
  for (const project of projects) {
    const pages = await loadPages(project);
    for (const page of pages) out.push({ project, page });
  }
  return out;
}

async function stagedVisualPages() {
  const staged = new Set(stagedFiles("*.html").map((file) => path.normalize(file)));
  if (staged.size === 0) return [];
  const projects = await listProjects();
  const pages = await visualPagesForProjects(projects);
  return pages.filter(({ project, page }) => staged.has(path.normalize(path.join(project, page.file))));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const targets =
    options.mode === "all" ? await visualPagesForProjects(await listProjects()) : await stagedVisualPages();

  const multiFrameTargets = [];
  for (const target of targets) {
    const result = await captureVisualManifest({
      project: target.project,
      pageName: target.page.name,
    });
    if (result.frame_count > 0) multiFrameTargets.push(result);
  }

  if (multiFrameTargets.length === 0) {
    console.log("[visual-review-hook] no staged multi-frame HTML pages. Skipping.");
    return;
  }

  for (const result of multiFrameTargets) {
    if (result.missing_capture_count !== 0) {
      throw new Error(
        `${result.project}/${result.page} missing visual review captures: ${result.missing_capture_count}`,
      );
    }
  }
  console.log(
    `[visual-review-hook] OK. checked=${multiFrameTargets.length} frame_count=${multiFrameTargets
      .map((result) => `${result.project}/${result.page}:${result.frame_count}`)
      .join(", ")}`,
  );
}

try {
  await main();
} catch (error) {
  console.error(`[visual-review-hook] ${error.message}`);
  console.error(
    "[visual-review-hook] Run npm run visual:manifest -- --project <project> --page <page> and inspect the generated crops before committing multi-frame HTML changes.",
  );
  process.exit(1);
}
