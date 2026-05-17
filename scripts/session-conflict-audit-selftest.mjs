import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const auditScript = path.join(scriptDir, "session-conflict-audit.mjs");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "session-conflict-audit-"));

function jsonl(items) {
  return `${items.map((item) => JSON.stringify(item)).join("\n")}\n`;
}

function run(args) {
  return JSON.parse(execFileSync("node", [auditScript, ...args], { encoding: "utf8" }));
}

try {
  const repo = path.join(tempDir, "design-blueprint");
  const otherRepo = path.join(tempDir, "other-repo");
  const sessionsDir = path.join(tempDir, "sessions");
  const summariesDir = path.join(tempDir, "summaries");
  await mkdir(repo, { recursive: true });
  await mkdir(otherRepo, { recursive: true });
  await mkdir(sessionsDir, { recursive: true });
  await mkdir(summariesDir, { recursive: true });

  await writeFile(
    path.join(sessionsDir, "cwd-exact.jsonl"),
    jsonl([
      { type: "session_meta", payload: { id: "cwd-exact", cwd: repo } },
      {
        type: "response_item",
        payload: {
          type: "message",
          role: "user",
          content: [{ text: "PR の ruleset とブランチ戦略を確認してください" }],
        },
      },
    ]),
  );
  await writeFile(
    path.join(sessionsDir, "repo-mention.jsonl"),
    jsonl([
      { type: "session_meta", payload: { id: "repo-mention", cwd: otherRepo } },
      {
        type: "response_item",
        payload: {
          type: "message",
          role: "user",
          content: [{ text: "design-blueprint の再発防止策を確認してください" }],
        },
      },
      {
        type: "response_item",
        payload: {
          type: "function_call",
          name: "exec_command",
          arguments: JSON.stringify({ workdir: repo, cmd: "git status --short" }),
        },
      },
    ]),
  );
  await writeFile(
    path.join(sessionsDir, "unrelated.jsonl"),
    jsonl([
      { type: "session_meta", payload: { id: "unrelated", cwd: otherRepo } },
      {
        type: "response_item",
        payload: {
          type: "message",
          role: "user",
          content: [{ text: "unrelated repo" }],
        },
      },
    ]),
  );

  await writeFile(
    path.join(summariesDir, "cwd-exact.md"),
    `cwd: ${repo}\nthread_id: summary-cwd-exact\nPR workflow was checked\n`,
  );
  await writeFile(
    path.join(summariesDir, "repo-mention.md"),
    "cwd: /tmp/elsewhere\nthread_id: summary-repo-mention\ndesign-blueprint needs recurrence prevention\n",
  );

  const summary = run(["--repo", repo, "--sessions-dir", sessionsDir, "--summaries-dir", summariesDir, "--summary"]);
  assert.equal(summary.raw_session_count, 1);
  assert.equal(summary.memory_summary_count, 1);
  assert.equal(summary.inventory_raw_session_count, 2);
  assert.equal(summary.inventory_memory_summary_count, 2);

  const inventory = run([
    "--repo",
    repo,
    "--sessions-dir",
    sessionsDir,
    "--summaries-dir",
    summariesDir,
    "--inventory",
  ]);
  assert.equal(inventory.raw_sessions.cwd_exact_count, 1);
  assert.equal(inventory.raw_sessions.candidate_mention_count, 1);
  assert.equal(inventory.raw_sessions.total_inventory_count, 2);
  assert.equal(inventory.memory_summaries.cwd_exact_count, 1);
  assert.equal(inventory.memory_summaries.candidate_mention_count, 1);
  assert.ok(inventory.raw_sessions.sessions.some((session) => session.match_reasons.includes("cwd_exact")));
  assert.ok(
    inventory.raw_sessions.sessions.some((session) => session.match_reasons.includes("tool_workdir_repo_mention")),
  );
  assert.ok(inventory.note.includes("false positives"));

  console.log("[session-conflict-audit-selftest] OK");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
