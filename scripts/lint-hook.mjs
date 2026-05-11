import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { EXCLUDED_DIRS, REPO_ROOT, listProjects } from "./vrt-config.mjs";
import { stagedFiles } from "./git-utils.mjs";

async function walkHtml(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    if (entry.name === "snapshots") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkHtml(full)));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

async function allHtmlFiles() {
  const projects = await listProjects();
  const out = [];
  for (const project of projects) {
    out.push(...(await walkHtml(path.join(REPO_ROOT, project))));
  }
  return out;
}

function runCmd(cmd, args, files) {
  const result = spawnSync(cmd, [...args, ...files], { stdio: "inherit" });
  return result.status ?? 1;
}

async function main() {
  const mode = process.argv.includes("--all") ? "all" : process.argv.includes("--staged") ? "staged" : null;
  if (!mode) {
    console.error("Usage: lint-hook.mjs --staged | --all");
    process.exit(2);
  }
  const files = mode === "all" ? await allHtmlFiles() : stagedFiles("*.html");
  if (files.length === 0) {
    console.log(`[lint-hook] no HTML files in ${mode} scope. Skipping.`);
    process.exit(0);
  }

  console.log(`[lint-hook] checking ${files.length} HTML file(s) in ${mode} mode`);
  const prettierStatus = runCmd("npx", ["--no-install", "prettier", "--check"], files);
  if (prettierStatus !== 0) {
    console.error("[lint-hook] prettier --check failed.");
    console.error(`[lint-hook] To fix: npx prettier --write ${files.join(" ")}`);
    process.exit(1);
  }
  const htmlhintStatus = runCmd("npx", ["--no-install", "htmlhint"], files);
  if (htmlhintStatus !== 0) {
    console.error("[lint-hook] htmlhint failed. See output above and fix rule violations.");
    process.exit(1);
  }
  console.log("[lint-hook] OK");
}

await main();
