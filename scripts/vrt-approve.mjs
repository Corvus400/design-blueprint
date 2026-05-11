import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { REPORT_DIR, actualPath, snapshotPath } from "./vrt-config.mjs";
import { gitAdd } from "./git-utils.mjs";

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { project: null, page: null };
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--project") out.project = args[(index += 1)];
    else if (args[index] === "--page") out.page = args[(index += 1)];
  }
  return out;
}

async function loadTargets() {
  const resultsPath = path.join(REPORT_DIR, "results.json");
  if (!existsSync(resultsPath)) {
    throw new Error(`results.json not found at ${resultsPath}. Run vrt-hook first.`);
  }
  const json = JSON.parse(await readFile(resultsPath, "utf8"));
  return json.results.filter((result) => result.type === "changed" || result.type === "new");
}

async function approveOne(project, page) {
  const src = actualPath(project, page);
  const dest = snapshotPath(project, page);
  if (!existsSync(src)) throw new Error(`actual not found: ${src}`);
  await mkdir(path.dirname(dest), { recursive: true });
  await copyFile(src, dest);
  gitAdd(path.relative(process.cwd(), dest));
  console.error(`[vrt-approve] approved: ${project}/${page} -> ${path.relative(process.cwd(), dest)}`);
}

async function main() {
  const { project, page } = parseArgs();
  const candidates = await loadTargets();
  const filtered = candidates.filter(
    (result) => (project ? result.project === project : true) && (page ? result.page === page : true),
  );
  if (filtered.length === 0) {
    console.error("[vrt-approve] no matching changed/new entries in results.json");
    process.exit(2);
  }
  for (const result of filtered) {
    await approveOne(result.project, result.page);
  }
  console.error(`[vrt-approve] approved ${filtered.length} page(s). Now run: git commit`);
}

await main();
