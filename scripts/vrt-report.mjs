import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { REPORT_DIR } from "./vrt-config.mjs";

function summarize(results) {
  const summary = { total: results.length, added: 0, new: 0, changed: 0, unchanged: 0 };
  for (const result of results) {
    summary[result.type] = (summary[result.type] ?? 0) + 1;
  }
  return summary;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderHtml({ summary, results }) {
  const rows = results
    .map((result) => {
      const img = result.compare_file_path
        ? `<img src="../../${escapeHtml(result.compare_file_path)}" alt="" loading="lazy">`
        : "&mdash;";
      const pct =
        result.diff_percentage === null || result.diff_percentage === undefined
          ? "&mdash;"
          : `${(result.diff_percentage * 100).toFixed(3)}%`;
      return (
        `<tr class="row-${escapeHtml(result.type)}">` +
        `<td>${escapeHtml(result.type)}</td>` +
        `<td>${escapeHtml(result.project)}</td>` +
        `<td>${escapeHtml(result.page)}</td>` +
        `<td>${pct}</td>` +
        `<td class="img">${img}</td>` +
        "</tr>"
      );
    })
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>VRT Report</title>
  <style>
    :root { color-scheme: dark; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; margin: 24px; background: #111; color: #eee; }
    h1 { margin: 0 0 8px; }
    .summary { margin-bottom: 24px; color: #bbb; }
    table { border-collapse: collapse; width: 100%; }
    th, td { padding: 8px 12px; border-bottom: 1px solid #333; vertical-align: top; }
    th { text-align: left; background: #1a1a1a; }
    tr.row-changed { background: rgba(255,80,80,0.08); }
    tr.row-new { background: rgba(80,160,255,0.08); }
    td.img img { max-width: 1200px; display: block; border: 1px solid #333; }
    code { background: #1a1a1a; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>VRT Report</h1>
  <p class="summary">total=${summary.total} new=${summary.new ?? 0} changed=${summary.changed ?? 0} unchanged=${
    summary.unchanged ?? 0
  }</p>
  <p>Comparison image for each changed page is rendered below. Open <code>.vrt-output/comparison/&lt;project&gt;/&lt;page&gt;.png</code> directly for full size.</p>
  <table>
    <thead><tr><th>Type</th><th>Project</th><th>Page</th><th>Diff %</th><th>Comparison</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>
`;
}

export async function writeReport(results) {
  await mkdir(REPORT_DIR, { recursive: true });
  const summary = summarize(results);
  const json = { summary, results };
  await writeFile(path.join(REPORT_DIR, "results.json"), JSON.stringify(json, null, 2));
  await writeFile(path.join(REPORT_DIR, "index.html"), renderHtml({ summary, results }));
  return json;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const intermediate = path.join(REPORT_DIR, ".intermediate.json");
  if (!existsSync(intermediate)) {
    console.error(`[vrt-report] missing ${intermediate}. Run vrt-compare first.`);
    process.exit(2);
  }
  const results = JSON.parse(await readFile(intermediate, "utf8"));
  const json = await writeReport(results);
  console.log(`[vrt-report] wrote results.json summary=${JSON.stringify(json.summary)}`);
}
