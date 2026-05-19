import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { comparisonPath } from "./vrt-config.mjs";

const LABEL_HEIGHT = 36;
const MAX_COMPARISON_PIXELS = 220_000_000;

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function labelSvg(text, width) {
  return Buffer.from(
    `<svg width="${width}" height="${LABEL_HEIGHT}" xmlns="http://www.w3.org/2000/svg">` +
      '<rect width="100%" height="100%" fill="#111111"/>' +
      `<text x="12" y="24" font-family="-apple-system,Helvetica,Arial,sans-serif" font-size="18" fill="#ffffff">${escapeXml(
        text,
      )}</text>` +
      "</svg>",
  );
}

async function readMeta(file) {
  const img = sharp(file, { limitInputPixels: false });
  const meta = await img.metadata();
  return { sharp: img, width: meta.width, height: meta.height };
}

async function paneWithLabel(file, label, targetWidth, targetHeight) {
  const { sharp: src, width, height } = await readMeta(file);
  const resized =
    width !== targetWidth || height !== targetHeight ? src.resize(targetWidth, targetHeight, { fit: "fill" }) : src;
  const body = await resized.png().toBuffer();
  return sharp({
    create: {
      width: targetWidth,
      height: targetHeight + LABEL_HEIGHT,
      channels: 4,
      background: "#111111",
    },
  })
    .composite([
      { input: labelSvg(label, targetWidth), top: 0, left: 0, limitInputPixels: false },
      { input: body, top: LABEL_HEIGHT, left: 0, limitInputPixels: false },
    ])
    .png()
    .toBuffer();
}

export async function composeOne({ project, page, expectedPath, diffPathArg, actualPath }) {
  const { width, height } = await readMeta(expectedPath);
  const totalComparisonPixels = width * 3 * (height + LABEL_HEIGHT);
  const comparisonScale =
    totalComparisonPixels > MAX_COMPARISON_PIXELS ? Math.sqrt(MAX_COMPARISON_PIXELS / totalComparisonPixels) : 1;
  const paneWidth = Math.max(1, Math.floor(width * comparisonScale));
  const paneHeight = Math.max(1, Math.floor(height * comparisonScale));
  const [expectedPane, diffPane, actualPane] = await Promise.all([
    paneWithLabel(expectedPath, "Expected", paneWidth, paneHeight),
    paneWithLabel(diffPathArg, "Diff", paneWidth, paneHeight),
    paneWithLabel(actualPath, "Actual", paneWidth, paneHeight),
  ]);
  const outPath = comparisonPath(project, page);
  await mkdir(path.dirname(outPath), { recursive: true });
  await sharp({
    create: {
      width: paneWidth * 3,
      height: paneHeight + LABEL_HEIGHT,
      channels: 4,
      background: "#111111",
    },
  })
    .composite([
      { input: expectedPane, top: 0, left: 0, limitInputPixels: false },
      { input: diffPane, top: 0, left: paneWidth, limitInputPixels: false },
      { input: actualPane, top: 0, left: paneWidth * 2, limitInputPixels: false },
    ])
    .png()
    .toFile(outPath);
  return outPath;
}

export async function composeFromResults(results) {
  const updated = [];
  for (const result of results) {
    if (result.type !== "changed") {
      updated.push(result);
      continue;
    }
    const outPath = await composeOne({
      project: result.project,
      page: result.page,
      expectedPath: result.golden_file_path,
      diffPathArg: result.diff_file_path,
      actualPath: result.actual_file_path,
    });
    updated.push({ ...result, compare_file_path: path.relative(process.cwd(), outPath) });
  }
  return updated;
}
