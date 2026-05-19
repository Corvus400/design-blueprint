import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const MARKER_SCOPE = "repo-wide-html-design-artifact";
const MARKER_ATTR = "data-codex-repo-wide-implementation-readiness";
const FRAME_ATTR = "data-frame-label";
const marker = `    <div
      hidden
      data-codex-repo-wide-implementation-readiness="source-plus-rendered-evidence"
      data-implementation-parity-scope="${MARKER_SCOPE}"
    >
      Repo-wide implementation readiness gate. implementation source evidence + rendered frame evidence. Do not use
      VRT or visual manifest as implementation parity evidence by itself.
    </div>
`;

function htmlFiles() {
  return execFileSync("rg", ["--files"], { encoding: "utf8" })
    .split(/\n/)
    .filter((file) => file.endsWith(".html") && !/(^|\/)snapshots\//.test(file));
}

let changed = 0;
for (const file of htmlFiles()) {
  const html = await readFile(file, "utf8");
  let next = html.replaceAll("repo-wide-app-spec", MARKER_SCOPE);
  if (!next.includes(MARKER_ATTR)) {
    next = next.replace(/(<body[^>]*>\n)/, `$1${marker}`);
  }
  if (!next.includes(FRAME_ATTR)) {
    next = next.replace(/<body([^>]*)>/, `<body$1 ${FRAME_ATTR}="document">`);
  }
  if (next !== html) {
    await writeFile(file, next);
    changed += 1;
  }
}

console.log(`[ensure-html-readiness-marker] updated=${changed}`);
