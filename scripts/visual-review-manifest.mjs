import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { OUTPUT_DIR, PAGE_GOTO_TIMEOUT_MS, REPO_ROOT, loadPages } from "./vrt-config.mjs";

function parseArgs(argv) {
  const options = { project: null, page: null, maxFrames: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--project") options.project = argv[(index += 1)];
    else if (arg === "--page") options.page = argv[(index += 1)];
    else if (arg === "--max-frames") options.maxFrames = Number(argv[(index += 1)]);
    else if (arg === "--help" || arg === "-h") {
      console.log("Usage: visual-review-manifest.mjs --project <project> --page <page> [--max-frames <n>]");
      process.exit(0);
    }
  }
  if (!options.project || !options.page) {
    throw new Error("Usage: visual-review-manifest.mjs --project <project> --page <page> [--max-frames <n>]");
  }
  return options;
}

function safeName(value) {
  return value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export async function captureVisualManifest({ project, pageName, maxFrames = null, outputScreenshots = true }) {
  const pages = await loadPages(project);
  const target = pages.find((page) => page.name === pageName);
  if (!target) throw new Error(`page not found in ${project}/pages.json: ${pageName}`);

  const htmlAbs = path.join(REPO_ROOT, project, target.file);
  const outDir = path.join(OUTPUT_DIR, "visual-review", project, pageName);
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: target.viewport,
    deviceScaleFactor: target.deviceScaleFactor,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  try {
    await page.goto(pathToFileURL(htmlAbs).toString(), {
      timeout: PAGE_GOTO_TIMEOUT_MS,
      waitUntil: "networkidle",
    });

    const frames = await page.$$eval("[data-frame-label]", (nodes) =>
      nodes.map((node, index) => ({
        index,
        label: node.getAttribute("data-frame-label") || "",
        state: node.getAttribute("data-state") || "",
        tab: node.getAttribute("data-tab") || "",
        device: node.getAttribute("data-device") || "",
        theme: node.classList.contains("dark") ? "dark" : "light",
      })),
    );

    if (frames.length === 0) throw new Error(`no [data-frame-label] frames found in ${target.file}`);
    if (maxFrames !== null && frames.length > maxFrames) {
      throw new Error(`frame count ${frames.length} exceeds --max-frames ${maxFrames}`);
    }

    const captures = [];
    for (const frame of frames) {
      const fileName = `${String(frame.index + 1).padStart(3, "0")}-${safeName(frame.label || `frame-${frame.index}`)}.png`;
      const relativePath = path.join(".vrt-output", "visual-review", project, pageName, fileName);
      const absPath = path.join(REPO_ROOT, relativePath);
      if (outputScreenshots) {
        const locator = page.locator("[data-frame-label]").nth(frame.index);
        await locator.screenshot({ path: absPath, animations: "disabled" });
      }
      captures.push({ ...frame, screenshot: relativePath });
    }

    const manifest = {
      project,
      page: pageName,
      page_file: target.file,
      generated_at: new Date().toISOString(),
      frame_count: frames.length,
      capture_count: captures.length,
      missing_capture_count: frames.length - captures.length,
      captures,
    };
    await writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
    return { ...manifest, manifest_path: path.relative(REPO_ROOT, path.join(outDir, "manifest.json")) };
  } finally {
    await context.close();
    await browser.close();
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const manifest = await captureVisualManifest({
    project: options.project,
    pageName: options.page,
    maxFrames: options.maxFrames,
  });
  if (manifest.missing_capture_count !== 0) {
    throw new Error(`missing visual captures: ${manifest.missing_capture_count}`);
  }
  console.log(
    `[visual-review-manifest] OK project=${options.project} page=${options.page} frames=${manifest.frame_count} manifest=${manifest.manifest_path}`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
