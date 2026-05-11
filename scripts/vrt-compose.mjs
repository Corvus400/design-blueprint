import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { comparisonPath } from "./vrt-config.mjs";

const LABEL_HEIGHT = 36;

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
  const img = sharp(file);
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
      { input: labelSvg(label, targetWidth), top: 0, left: 0 },
      { input: body, top: LABEL_HEIGHT, left: 0 },
    ])
    .png()
    .toBuffer();
}

export async function composeOne({ project, page, expectedPath, diffPathArg, actualPath }) {
  const { width, height } = await readMeta(expectedPath);
  const [expectedPane, diffPane, actualPane] = await Promise.all([
    paneWithLabel(expectedPath, "Expected", width, height),
    paneWithLabel(diffPathArg, "Diff", width, height),
    paneWithLabel(actualPath, "Actual", width, height),
  ]);
  const outPath = comparisonPath(project, page);
  await mkdir(path.dirname(outPath), { recursive: true });
  await sharp({
    create: {
      width: width * 3,
      height: height + LABEL_HEIGHT,
      channels: 4,
      background: "#111111",
    },
  })
    .composite([
      { input: expectedPane, top: 0, left: 0 },
      { input: diffPane, top: 0, left: width },
      { input: actualPane, top: 0, left: width * 2 },
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
