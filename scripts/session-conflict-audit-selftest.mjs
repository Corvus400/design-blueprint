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
  await mkdir(path.join(repo, ".git"), { recursive: true });
  await mkdir(path.join(repo, "example-html-spec"), { recursive: true });
  await mkdir(otherRepo, { recursive: true });
  await mkdir(sessionsDir, { recursive: true });
  await mkdir(summariesDir, { recursive: true });
  await writeFile(
    path.join(repo, ".git", "config"),
    '[remote "origin"]\n\turl = https://github.com/example-owner/example-blueprint\n',
  );
  await writeFile(
    path.join(repo, "example-html-spec", "pages.json"),
    JSON.stringify({
      pages: [
        {
          name: "search-results",
          file: "Search Results/Search Results.html",
        },
      ],
    }),
  );

  await writeFile(
    path.join(sessionsDir, "cwd-exact.jsonl"),
    jsonl([
      { type: "session_meta", payload: { id: "cwd-exact", cwd: repo } },
      {
        type: "response_item",
        payload: {
          type: "message",
          role: "user",
          content: [
            {
              text: [
                "PR の ruleset とブランチ戦略を確認してください",
                "実装と同じにしろと言っているのに近似で済ませないでください",
                "実装に存在しない Other app neighbor や独自実装キーボードを残さないでください",
                "実機の見た目と実装両方を照らし合わせ、検証項目が未達ならコミットしないでください",
                "検証手段を見直し、DOM や VRT だけでは不足していることを認識してください",
                "指摘されないと分からない状態を止め、自分で認知・修正のイテレーションを回してください",
              ].join("。"),
            },
          ],
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
    path.join(sessionsDir, "alias-mention.jsonl"),
    jsonl([
      { type: "session_meta", payload: { id: "alias-mention", cwd: otherRepo } },
      {
        type: "response_item",
        payload: {
          type: "message",
          role: "user",
          content: [{ text: "example-blueprint の search-results ページで全UIの見た目を再監査してください" }],
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
  await writeFile(
    path.join(summariesDir, "alias-mention.md"),
    "cwd: /tmp/elsewhere\nthread_id: summary-alias-mention\nexample-owner/example-blueprint search-results visual coverage\n",
  );

  const summary = run(["--repo", repo, "--sessions-dir", sessionsDir, "--summaries-dir", summariesDir, "--summary"]);
  assert.equal(summary.raw_session_count, 1);
  assert.equal(summary.memory_summary_count, 1);
  assert.equal(summary.inventory_raw_session_count, 3);
  assert.equal(summary.inventory_memory_summary_count, 3);
  assert.equal(summary.raw_categories.goal_branch_workflow, 1);
  assert.equal(summary.raw_categories.all_ui_visual_coverage, 0);
  assert.equal(summary.raw_categories.approximation_used, 1);
  assert.equal(summary.raw_categories.invented_ui_surface, 1);
  assert.equal(summary.raw_categories.implementation_parity_gap, 1);
  assert.equal(summary.raw_categories.premature_visual_completion, 1);
  assert.equal(summary.raw_categories.real_device_evidence_gap, 1);
  assert.equal(summary.raw_categories.invalid_verification_method, 1);
  assert.equal(summary.raw_categories.human_oracle_loop, 1);
  assert.equal(summary.inventory_categories.raw_sessions.goal_branch_workflow, 1);
  assert.equal(summary.inventory_categories.raw_sessions.all_ui_visual_coverage, 1);
  assert.equal(summary.inventory_categories.raw_sessions.approximation_used, 1);
  assert.equal(summary.inventory_categories.raw_sessions.invented_ui_surface, 1);
  assert.equal(summary.inventory_categories.raw_sessions.implementation_parity_gap, 1);
  assert.equal(summary.inventory_categories.raw_sessions.premature_visual_completion, 1);
  assert.equal(summary.inventory_categories.raw_sessions.real_device_evidence_gap, 1);
  assert.equal(summary.inventory_categories.raw_sessions.invalid_verification_method, 1);
  assert.equal(summary.inventory_categories.raw_sessions.human_oracle_loop, 1);
  assert.equal(summary.inventory_categories.memory_summaries.all_ui_visual_coverage, 0);
  assert.ok(summary.coverage.aliases.includes("example-owner/example-blueprint"));
  assert.ok(summary.coverage.aliases.includes("example-html-spec"));
  assert.ok(summary.coverage.aliases.includes("search-results"));

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
  assert.equal(inventory.raw_sessions.candidate_mention_count, 2);
  assert.equal(inventory.raw_sessions.total_inventory_count, 3);
  assert.equal(inventory.memory_summaries.cwd_exact_count, 1);
  assert.equal(inventory.memory_summaries.candidate_mention_count, 2);
  assert.ok(inventory.raw_sessions.sessions.some((session) => session.match_reasons.includes("cwd_exact")));
  assert.ok(
    inventory.raw_sessions.sessions.some((session) => session.match_reasons.includes("tool_workdir_repo_mention")),
  );
  assert.ok(
    inventory.raw_sessions.sessions.some(
      (session) => session.id === "alias-mention" && session.alias_mention_count >= 2,
    ),
  );
  assert.ok(inventory.note.includes("false positives"));

  console.log("[session-conflict-audit-selftest] OK");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
