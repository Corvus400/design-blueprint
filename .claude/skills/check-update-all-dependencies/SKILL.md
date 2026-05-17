---
name: check-update-all-dependencies
description: Review Renovate-generated dependency update PRs and post an analysis report as a PR comment. Use when reviewing dependency PRs in batch or when assessing the impact of a specific update. Triggers include "依存関係更新PRをレビュー", "Renovate PRをチェック", "dependencies ラベルのPRを確認", "依存アップデートの影響分析", "dependency update review", "check renovate prs".
allowed-tools: Bash(gh pr:*), Bash(gh issue:*), Bash(gh api:*), Bash(gh repo view:*), Bash(gh pr diff:*), Bash(gh pr comment:*), Bash(bash .claude/skills/check-update-all-dependencies/scripts/*), Read, Grep, Glob, WebFetch, Task, mcp__context7__resolve-library-id, mcp__context7__query-docs
---

# check-update-all-dependencies

Review Renovate-generated dependency update PRs and post an analysis report as a PR comment.

## Arguments

- `dry-run` (optional): print reports to stdout without posting.

## Preconditions

- Renovate is enabled and labels PRs with `dependencies`.
- `renovate.json` should contain `prBodyColumns` with `"Source"` and `prBodyDefinitions.Source` template for best source-link extraction. If the Source column is absent, continue with fallback release-note/compare links instead of failing.
- `gh` CLI is authenticated.

## Step 0 — Collect project runtime requirements

Before looking at any PR, harvest the project's pinned runtime versions (Node, npm, GitHub Actions runner/action pins, etc.). These values become the judgement baseline in Step 7. The skill must work in this repository, so do NOT hardcode values like "Node 24". Instead, walk the source list below in order and stop when a concrete version is found for each runtime. Record every hit with `file:line` so the subagents can cite it in the report.

### Source preference (config files before docs)

The ordering is deliberate: machine-readable config rarely drifts, while README text often goes stale. Skip a source if it doesn't exist — don't error out.

1. `.github/workflows/*.yml` — `node-version: 'N'`, pinned `uses:` actions, and runner version assumptions
2. `package.json` — the `engines` block and npm package manager constraints
3. `package-lock.json` — root package `engines` and lockfile version
4. `.tool-versions` / `.nvmrc` / `.node-version`
5. `Dockerfile` — the `FROM image:tag` line on any final runtime stage
6. `CLAUDE.md` / `AGENTS.md`
7. `README.md` / `README.*` — technology-stack, prerequisites, or requirements sections

### Conflict handling

If two sources disagree (e.g., CI uses Node 24 but `package.json` allows `>=18.18.0`), trust the narrower runtime used by CI for merge-safety judgement and surface the discrepancy in the Notes column of Step 10 rather than stopping. The point of the report is to make disagreements visible, not to paper over them.

### Output

Emit a small table and pass it inline to every Step 4 subagent prompt:

```
| Runtime | Version | Source |
|---------|---------|--------|
| node    | 24      | .github/workflows/ci.yml:35 |
| node    | >=18.18.0 | package.json:8 |
```

If no runtime requirement is detected at all, say so explicitly ("no pinned runtime found"). This absence is itself information for the subagents — they will fall back to the generic Step 7 judgement rule.

## Step 1 — Resolve target repository

Do NOT hardcode any owner/name.

```bash
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
```

## Step 2 — Discover target PRs

```bash
gh pr list --repo "$REPO" --label dependencies --state open --json number,title,url,labels
```

If empty, fall back to the Dependency Dashboard issue:

```bash
gh issue list --repo "$REPO" --label renovate --state open \
  --search "Dependency Dashboard in:title" --json number,title,url,body
```

Parse the checklist entries in the issue body and emit a single summary instead of per-PR comments.

## Step 3 — Load SSOT artifacts

```
Read package.json
Read package-lock.json
Read renovate.json
Read .github/workflows/*.yml
```

## Step 4 — Per-PR parallel analysis

For each PR number, spawn a subagent through the `Agent` tool. The invocation MUST satisfy every requirement below — `/usr/local/bin/cc-guard-agent-prompt` rejects calls that skip them, which is the root cause of repeated "[blocked]" errors observed in prior runs.

### Mandatory parameters

- `subagent_type: "general-purpose"` — required by Rule 0 of the guard. Missing value exits 2 (`cc-guard-agent-prompt:22-28`).
- `model: "sonnet"` — required by Rule 1. `general-purpose` has no matching file under `~/.claude/agents/`, so the guard treats it as a built-in type and demands an explicit model. `opus` requires an `[opus理由:<漢字5文字以上>]` tag, `haiku` forbids research keywords, so `sonnet` is the only reliable choice for this analysis work.
- `description`: short imperative, e.g. `"Analyze PR #<num>"`.
- `prompt`: must contain ALL of the following so the guard accepts it and the subagent can work self-contained:
  - The literal phrase `エビデンス付きで報告すること（ファイルパス:行番号:該当コード）` — Rule 4 demands this whenever the prompt uses research keywords (分析/確認/検証/報告/調査/調べ), all of which inevitably appear in this workflow.
  - `$REPO`, the PR number, the Step 0 runtime requirements (see Step 0), and the Step 3 SSOT file contents inlined.
  - The checklist below (Steps 5–9) so the subagent does not need to re-read this file.
  - An explicit line stating the subagent MUST NOT call `mcp__*` tools and MUST NOT use `Write` / `Edit` / `NotebookEdit` — this protects against future `disallowedTools` enforcement changes and keeps subagents read-only by policy.

### One-shot invocation template

The block below is a structural illustration. The actual `Agent` call uses JSON parameters (`description`, `subagent_type`, `model`, `prompt`); the YAML-like layout here is for readability only.

```
Agent:
  description: "Analyze PR #<num>"
  subagent_type: "general-purpose"
  model: "sonnet"
  prompt: |
    <repo> の PR #<num> を確認し、依存更新の影響を分析して報告してください。

    Steps 5–9 チェックリスト:
      1. collect-pr-facts.sh を実行し facts.json を生成
      2. apply-gotchas.sh で warnings.json を生成
      3. リリースノート要約 (Breaking / Features / Fixes / Deprecations)
      4. プロジェクト要件照合 (Step 0 の抽出結果と更新先を照合)
      5. Step 7 の Recommended action rule に従い判定ラベルを一つ確定
      6. references/report-template.md にプレースホルダーを埋めて最終レポート出力

    SSOT とプロジェクト要件 (inline 展開):
    <package.json / package-lock.json / .github/workflows/*.yml の内容>
    <renovate.json の内容>
    <Step 0 で抽出したランタイム要件 (出典ファイル:行番号つき)>

    エビデンス付きで報告すること（ファイルパス:行番号:該当コード）。
    MCP ツール (mcp__*) は呼び出さないこと。Write / Edit / NotebookEdit は使わないこと。
```

### Reject patterns (each one maps to a guard rule)

- Omit `subagent_type` → Rule 0 (`cc-guard-agent-prompt:22-28`) exits 2.
- Omit `model` → Rule 1 (`cc-guard-agent-prompt:175-179`) exits 2.
- Pick `model: "opus"` without `[opus理由:<漢字5文字以上>]` → Rule 2 (`cc-guard-agent-prompt:182-238`).
- Pick `model: "haiku"` while the prompt contains 調査/分析/比較/整合性 → Rule 3 (`cc-guard-agent-prompt:241-250`).
- Include a research keyword but omit `エビデンス` → Rule 4 (`cc-guard-agent-prompt:253-270`).
- Tell the subagent to call `mcp__*` or to use `Write` / `Edit` / `NotebookEdit` (custom agents enforce this via `disallowedTools`).

### Judgement label lock-in

Each subagent picks exactly one label from the Step 7 vocabulary (`保留` / `要緊急対応` / `要対応` / `要確認` / `マージ可`). When the parent session aggregates results in Step 10, it MUST NOT rewrite a subagent's label. If the parent disagrees, it opens a new review round rather than silently swapping the label — this prevents the drift that caused the same PR to flip between "マージ可" and "保留" across the intermediate and final tables in past runs.

## Step 5 — Phase A: collect facts

```bash
bash .claude/skills/check-update-all-dependencies/scripts/collect-pr-facts.sh \
  "$REPO" "$PR_NUMBER" > facts.json
```

If `._parse_failed == true`, use `._raw_body` as context instead of structured fields.

## Step 6 — Phase A: gotchas

```bash
bash .claude/skills/check-update-all-dependencies/scripts/apply-gotchas.sh \
  package.json renovate.json < facts.json > warnings.json
```

## Step 7 — Phase B: semantic synthesis

Using `facts.json` + `warnings.json`:

1. Summarize each package's `release_notes_raw` into four buckets: Breaking changes / New features / Bug fixes / Deprecations. When empty, fetch via `gh api repos/<owner>/<repo>/releases/tags/<tag>` (try `v<new>` then `<new>`) where `<owner>/<repo>` comes from `source_url`. If still empty, `WebFetch "$compare_url"` for commit titles.
2. When `warnings[].code == "MAJOR_BUMP"`, call `mcp__context7__resolve-library-id` then `mcp__context7__query-docs` with "breaking changes migration guide for <depName> <old>→<new>". Skip for minor/patch.
3. Extract API/class/function names from Breaking changes and `Grep`:
   - Node scripts: `scripts/`, `package.json`, `package-lock.json`
   - HTML tooling: `*.mjs`, `*.js`, `*.html`
   - GitHub Actions: `.github/workflows/`
   - Docker if present: `Dockerfile`, `docker-compose*.yml`
4. Recommended action rule (evaluate top-down; the first match wins):
   - The update is a `MAJOR_BUMP` AND Step 0 detected a pinned requirement for the same runtime AND the PR's target version differs from that requirement → `保留 (project requirement mismatch: <runtime> <pinned> vs <target>; sources: <file:line,...>)`. Merging this PR would break the project's declared toolchain contract; reviewers should either revise the pinning first or close the PR.
   - `VULN_ALERT` present → `要緊急対応 (security, urgent merge)`
   - Any Breaking change hit in code → `要対応 (action required)`
   - `MAJOR_BUMP` without Breaking hits → `要確認 (manual verification)`
   - Otherwise → `マージ可 (safe to merge)`

5. Merge-order hint (populates `{{merge_order_hint}}` in the per-PR report):
   - `保留` → `—` (not merged, so no order).
   - `要緊急対応` → `1 (security)` — merge ahead of everything.
   - `要対応` or `要確認` → `manual review — sequence with toolchain updates`.
   - `マージ可`, independent of other PRs → `順不同 (independent)`.
   - `マージ可`, but depends on a toolchain/major bump in another PR → `after #<blocker PR>`.

## Step 8 — Render report

Read `references/report-template.md`. Substitute placeholders with Phase A + Phase B outputs. Escape external `#NNN` to `` `#NNN` ``. Data source footer must be one of: `Primary`, `Primary+Fallback`, `Primary+Fallback+MigrationGuide`, `Fallback-only (parse failed)`.

Placeholders added for this skill version:

- `{{merge_order_hint}}` — the hint derived in Step 7.5. Always fill it; use `—` for `保留`.
- `{{project_requirement_check}}` — copy the Step 0 table entry for the runtime this PR touches, then add one line saying whether the PR matches the pinned version. When Step 0 found no pinned runtime, write `no pinned runtime detected for this dependency`.

## Step 9 — Post or dry-run

```bash
if [ "$MODE" = "dry-run" ]; then
  printf '%s\n' "$REPORT"
else
  gh pr comment --repo "$REPO" "$PR_NUMBER" --body "$REPORT"
  gh pr view --repo "$REPO" "$PR_NUMBER" --json url -q .url
fi
```

## Step 10 — Aggregate summary

After every per-PR subagent has returned, the parent session emits one aggregate summary for the whole review batch. Always include the full column set below, even when only one PR was reviewed — the column consistency is what lets reviewers scan a batch at a glance. Never omit the "マージ順序" or "プロジェクト要件照合" columns; put `—` when they don't apply rather than deleting the column.

### Required format

```
| PR | 内容 | 判定 | マージ順序 | プロジェクト要件照合 | コメントURL |
|----|------|------|------------|--------------------|-------------|
| #10 | ktor 3.4.2 (patch) | マージ可 | 順不同 | — | <url> |
| #17 | eclipse-temurin 21-jre → 25-jre | 保留 | — | 不一致 (java 21 @ build.gradle.kts:18 vs 更新先 25) | <url> |
```

### Column rules

- **PR**: escape to `#NNN` inline code when referring to external issue numbers; bare PR numbers for this repo are fine.
- **内容**: one-line summary (package, version range, kind: patch/minor/major/toolchain).
- **判定**: copied verbatim from the subagent. The parent MUST NOT rewrite it (see Step 4 "Judgement label lock-in").
- **マージ順序**: from `{{merge_order_hint}}`. Cluster security/urgent first, independents as `順不同`, dependents as `after #<PR>`, `保留` as `—`.
- **プロジェクト要件照合**: `—` if Step 0 found no relevant requirement; otherwise `一致` or `不一致 (<runtime> <pinned> @ <source> vs 更新先 <target>)`.
- **コメントURL**: the URL returned by `gh pr comment` (or `(dry-run)` when running with `dry-run`).

### Consistency check before emitting

Before printing the table, scan each row and verify: (a) every `保留` row has `—` in マージ順序, (b) every `不一致` cell names an actual file from the Step 0 source list, (c) no label changed between the per-PR report and this aggregate. If any check fails, go back to the offending subagent rather than silently fixing it in the aggregate.

## Gotchas

- `prBodyDefinitions.Source` should exist in `renovate.json`. Without it, `source_url` may be empty; continue with release-note bodies and `compare_url` fallback rather than guessing a source URL.
- Renovate PR body format may change across major Renovate versions. `_parse_failed=true` is not an error — use `_raw_body` as the context and continue.
- Never post `#NNN` directly; always escape.
- Spawn one Task per PR; do not serialize.
- For Dependency Dashboard fallback (Step 2), emit a single summary message; skip per-PR posting.
- The aggregate summary (Step 10) is for the parent session only — individual PR comments already contain per-PR detail. Don't post Step 10 back to any PR; show it in the chat so the reviewer can decide merge order.
