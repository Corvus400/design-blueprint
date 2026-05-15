import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { auditFiles } from "./html-audit.mjs";

const tempDir = await mkdtemp(path.join(os.tmpdir(), "html-audit-"));

try {
  const rulesDir = path.join(tempDir, "rules");
  const goodHtml = path.join(tempDir, "good.html");
  const badHtml = path.join(tempDir, "bad.html");

  await mkdir(rulesDir);
  await writeFile(
    goodHtml,
    `
      <!doctype html>
      <html>
        <body>
          <aside class="toc"><a href="#sec-01">One</a></aside>
          <main>
            <section class="block" id="sec-01">
              <div class="device">
                <button class="fab">Delete all</button>
                <div class="hrow" data-row-type="disease">
                  <div class="row-body"><div class="row-head"><div class="row-brand">Disease</div></div></div>
                </div>
              </div>
            </section>
          </main>
        </body>
      </html>
    `,
  );
  await writeFile(
    badHtml,
    `
      <!doctype html>
      <html>
        <body>
          <aside class="toc"><a href="#missing">Missing</a></aside>
          <main>
            <section class="block" id="sec-01">
              <div class="chiprow"></div>
              <div class="pane-left"><div class="empty-wrap"></div></div>
              <div><button class="fab">Delete all</button></div>
              <div class="hrow" data-row-type="disease">
                <div class="row-img"></div>
                <div class="row-body"><div class="row-head"><div class="row-brand">Disease</div></div></div>
              </div>
            </section>
          </main>
        </body>
      </html>
    `,
  );
  await writeFile(
    path.join(rulesDir, "good.json"),
    JSON.stringify(
      {
        file: goodHtml,
        tocSections: {
          tocSelector: '.toc a[href^="#"]',
          sectionSelector: "section[id]",
          requiredAnchors: ["sec-01"],
        },
        forbiddenSelectors: [".chiprow", ".pane-left .empty-wrap"],
        requiredText: ["Delete all", { pattern: 'data-row-type="disease"' }],
        forbiddenDescendants: [
          {
            ancestor: '.hrow[data-row-type="disease"]',
            descendant: ".row-img",
          },
        ],
        requiredDirectParent: [
          {
            selector: ".fab",
            parent: ".device",
          },
        ],
      },
      null,
      2,
    ),
  );
  await writeFile(
    path.join(rulesDir, "bad.json"),
    JSON.stringify(
      {
        file: badHtml,
        tocSections: {
          tocSelector: '.toc a[href^="#"]',
          sectionSelector: "section[id]",
          requiredAnchors: ["sec-01"],
        },
        forbiddenSelectors: [".chiprow", ".pane-left .empty-wrap"],
        requiredText: ["Delete selected", { pattern: 'data-row-type="drug"' }],
        forbiddenDescendants: [
          {
            ancestor: '.hrow[data-row-type="disease"]',
            descendant: ".row-img",
          },
        ],
        requiredDirectParent: [
          {
            selector: ".fab",
            parent: ".device",
          },
        ],
      },
      null,
      2,
    ),
  );

  const good = await auditFiles({ files: [goodHtml], rulesDir });
  assert.equal(good.audited, 1);
  assert.deepEqual(good.failures, []);

  const bad = await auditFiles({ files: [badHtml], rulesDir });
  assert.equal(bad.audited, 1);
  assert.ok(bad.failures.some((failure) => failure.check === "forbiddenSelectors"));
  assert.ok(bad.failures.some((failure) => failure.check === "requiredText"));
  assert.ok(bad.failures.some((failure) => failure.check === "forbiddenDescendants"));
  assert.ok(bad.failures.some((failure) => failure.check === "requiredDirectParent"));
  assert.ok(bad.failures.some((failure) => failure.check === "tocSections"));
  console.log("[html-audit-selftest] OK");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
