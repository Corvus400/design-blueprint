import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { listProjects, snapshotPath } from "./vrt-config.mjs";
import { captureProjects } from "./vrt-capture.mjs";
import { compareProjects } from "./vrt-compare.mjs";
import { composeFromResults } from "./vrt-compose.mjs";
import { writeReport } from "./vrt-report.mjs";
import { gitAdd, stagedFiles } from "./git-utils.mjs";

function affectedProjectsFromStaged(allProjects) {
  const staged = stagedFiles();
  const set = new Set();
  for (const file of staged) {
    const top = file.split("/")[0];
    if (allProjects.includes(top)) set.add(top);
  }
  return [...set];
}

function summarizeResults(results) {
  const buckets = { new: [], changed: [], unchanged: [] };
  for (const result of results) {
    buckets[result.type]?.push(result);
  }
  return buckets;
}

async function recordNewBaselines(newResults) {
  const recorded = [];
  for (const result of newResults) {
    const dest = snapshotPath(result.project, result.page);
    await mkdir(path.dirname(dest), { recursive: true });
    await copyFile(path.join(process.cwd(), result.actual_file_path), dest);
    gitAdd(path.relative(process.cwd(), dest));
    recorded.push(dest);
  }
  return recorded;
}

async function main() {
  const mode = process.argv.includes("--all") ? "all" : process.argv.includes("--staged") ? "staged" : null;
  if (!mode) {
    console.error("Usage: vrt-hook.mjs --staged | --all");
    process.exit(2);
  }
  const allProjects = await listProjects();
  if (allProjects.length === 0) {
    console.log("[vrt-hook] no projects (no */pages.json found). Skipping.");
    process.exit(0);
  }
  const targets = mode === "all" ? allProjects : affectedProjectsFromStaged(allProjects);
  if (targets.length === 0) {
    console.log("[vrt-hook] no staged design changes. Skipping.");
    process.exit(0);
  }

  console.log(`[vrt-hook] running ${mode} for: ${targets.join(", ")}`);
  await captureProjects(targets);
  const compared = await compareProjects(targets);
  const composed = await composeFromResults(compared);
  await writeReport(composed);

  const { new: news, changed, unchanged } = summarizeResults(composed);
  if (news.length > 0) {
    const recorded = await recordNewBaselines(news);
    console.error(`[vrt-hook] INITIAL BASELINE recorded for ${news.length} page(s):`);
    for (const file of recorded) console.error(`  - ${path.relative(process.cwd(), file)}`);
    console.error(
      "[vrt-hook] Initial baselines are treated as starting points. See CLAUDE.md (initial-baseline) for review steps.",
    );
  }
  if (changed.length > 0) {
    console.error(`[vrt-hook] VRT DIFF detected on ${changed.length} page(s):`);
    for (const item of changed) {
      console.error(
        `  - ${item.project}/${item.page}: diff=${(item.diff_percentage * 100).toFixed(3)}% comparison=${
          item.compare_file_path
        }`,
      );
    }
    console.error("[vrt-hook] HTML report: .vrt-output/report/index.html");
    console.error("[vrt-hook] Accept as new baseline: npm run vrt:approve -- --project <name> --page <name>");
    console.error("[vrt-hook] For AI judgement: ask Claude Code / Codex (CLAUDE.md / AGENTS.md)");
    process.exit(1);
  }
  console.log(`[vrt-hook] OK. unchanged=${unchanged.length} new=${news.length} changed=0`);
}

await main();
