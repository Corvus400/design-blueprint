import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ACTUAL_DIR, PAGE_GOTO_TIMEOUT_MS, REPO_ROOT, actualPath, listProjects, loadPages } from "./vrt-config.mjs";

export async function captureProject(project) {
  const pages = await loadPages(project);
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const page of pages) {
      const htmlAbs = path.join(REPO_ROOT, project, page.file);
      const url = pathToFileURL(htmlAbs).toString();
      const context = await browser.newContext({
        viewport: page.viewport,
        deviceScaleFactor: page.deviceScaleFactor,
        reducedMotion: "reduce",
      });
      const playPage = await context.newPage();
      try {
        await playPage.goto(url, {
          timeout: PAGE_GOTO_TIMEOUT_MS,
          waitUntil: "networkidle",
        });
        const outPath = actualPath(project, page.name);
        await mkdir(path.dirname(outPath), { recursive: true });
        await playPage.screenshot({
          path: outPath,
          animations: "disabled",
          mask: page.mask.map((selector) => playPage.locator(selector)),
          fullPage: true,
        });
        results.push({ project, page: page.name, actualPath: outPath });
      } catch (err) {
        console.error(
          `[vrt-capture] capture failed for ${project}/${page.name}: ${err.message}. ` +
            "External CDN fonts/scripts may be the cause; consider self-hosting.",
        );
        throw err;
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  return results;
}

export async function captureProjects(projects) {
  await mkdir(ACTUAL_DIR, { recursive: true });
  const all = [];
  for (const project of projects) {
    all.push(...(await captureProject(project)));
  }
  return all;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const projectFlag = args.indexOf("--project");
  if (projectFlag >= 0 && args[projectFlag + 1]) {
    await captureProject(args[projectFlag + 1]);
  } else if (args.includes("--all")) {
    await captureProjects(await listProjects());
  } else {
    console.error("Usage: vrt-capture.mjs --project <name> | --all");
    process.exit(2);
  }
}
