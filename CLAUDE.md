# Claude Code Operating Guide For design-blueprint

This repository stores HTML designs and gates every commit and push with VRT. As Claude Code, implement HTML changes that match the page HTML registered in `pages.json` and act as the visual reviewer when VRT detects a diff.

## Repository Invariants

- A directory at repository root is a VRT project if and only if it contains `pages.json`.
- `<project>/snapshots/chromium/<page>.png` is the git-tracked baseline.
- `.vrt-output/` is regenerated on hook runs. Never edit it by hand and never commit it.

## When Authoring Or Modifying HTML

1. Read the changed page HTML registered in `<project>/pages.json` first.
2. Make the HTML change.
3. Stage the changed HTML.
4. Commit so the pre-commit hook runs lint, matching HTML audit rules, and VRT.
5. If VRT reports an INITIAL BASELINE, that PNG is staged and committed together with the HTML. Initial captures are explicitly considered untrusted; review the rendered baseline against the page HTML.
6. If VRT reports a DIFF, switch to visual reviewer mode.

## Branch And PR Workflow

- This repository's default branch is protected by the active `protect-default-branch` ruleset. Do not commit directly to `main` for repo changes.
- Start from current `main`, create a feature branch, push it, and open a PR into `main`.
- PR titles and PR bodies must be Japanese. The PR body must include changed areas, verification results, and any intentional visual baseline approval.
- Do not merge until the required `ci-gate` status check passes and review threads are resolved.

## All-State Visual Review

- For multi-state HTML specs, visual review means every `[data-frame-label]` frame, not a representative section or the currently visible TOC area.
- Run `npm run visual:manifest -- --project <project> --page <page>` for changed multi-frame pages. Inspect `.vrt-output/visual-review/<project>/<page>/manifest.json` and the generated crops; `missing_capture_count` must be `0`.
- Search-screen work must cover at least empty, error, filter-open, sort-open, applied-filter results, loading, loading-more, iPhone landscape, iPad portrait, iPad landscape, and iPad Split View.
- Repeated visual misses around icon glyphs, bottom/nav selected treatment, result-card anatomy, placeholder image ratio/icon, shimmer rows, sticky chip headers, WCAG chip contrast, and pane width must be converted into inline verification or page-specific HTML audit rules before the task is closed.
- When icon, card, copy, or sizing truth exists in the implementation repo, read that source before changing the design HTML. Do not guess from a similar design page unless the task explicitly names it as the SSOT.

## HTML Audit Rules

- `scripts/html-audit.mjs` reads `scripts/html-audit-rules/*.json` and performs DOM-based structural checks for matching HTML files.
- Use audit rules for repo-specific invariants that htmlhint cannot know, such as forbidden stale selectors, required parent-child placement, TOC/section alignment, or data-shape constraints from an implementation repo.
- When repeated manual checks are needed during a large HTML repair, add a narrow audit rule and run `npm run html:audit` before VRT.

## Design Conflict Recovery

- If the user says a rendered design is broken, unchanged, or repeatedly regressing, stop speculative patching and first read `git diff`, the affected HTML, `pages.json`, the matching audit rule, and VRT actual/comparison output.
- For broad recurrence-prevention requests, run `npm run session:conflict-audit -- --repo . --summary` and `npm run session:conflict-audit -- --repo . --inventory` before proposing permanent fixes. Report scan counts, parse failures, `cwd_exact`, candidate counts, and inventory category totals. Use `cwd_exact` as the authoritative set, use remote/project/page alias hits only as completeness candidates, and never paste raw transcript text into reports.
- Split the fix into three buckets: mistaken current-session changes to revert, intended changes to keep, and guardrails to add. Do not keep a new contract merely because the updated verification was made to pass.
- Treat device classes, frame totals, state matrices, breakpoints, and responsive modes as locked contracts. Any change to them needs explicit source evidence from the page contract or implementation repo and must be reflected in audit rules.
- DOM audit and VRT are necessary but not sufficient for UI judgement. Inspect a rendered screenshot/crop of the affected state before approving a VRT diff or reporting that a visual conflict is resolved.
- The final corrected constraint must become deterministic: add a page-specific audit rule or inline verification row so the same broken state cannot pass on the next session.
- If the user says to revert or restore, confirm whether they mean unstaging or discarding worktree changes unless the wording is explicit. Never discard a visual correction just because it is not ready to stage.

## Visual Reviewer Mode

When pre-commit or pre-push fails with a VRT diff:

1. Read `.vrt-output/report/results.json` and find entries with `"type": "changed"`.
2. For each changed entry, read:
   - `compare_file_path`, the 3-pane comparison PNG: expected / diff / actual
   - `golden_file_path`, the current baseline
   - `actual_file_path`, the new render
   - `page_file`, the page HTML registered in `pages.json`
3. Emit a JSON object and only a JSON object:

```json
{
  "project": "...",
  "page": "...",
  "fulfillment_percent": 0,
  "explanation": "concise, focused on what changed and whether it matches the page HTML"
}
```

## Interpretation

- `fulfillment_percent >= 80`: intentional and matches spec. Recommend `npm run vrt:approve -- --project <project> --page <page>`, then re-commit.
- `20 <= fulfillment_percent < 80`: ambiguous. Surface the JSON to the user and let them decide.
- `fulfillment_percent < 20`: likely regression. Recommend fixing the HTML. Do not approve.

## Initial Baseline Review

The hook auto-stages the first capture as the baseline. The user explicitly accepts that initial baselines are unfinished. Treat the captured baseline as a draft and compare it to the page HTML registered in `pages.json`. Propose HTML changes to converge the baseline toward the page contract.

## Forbidden

- `git commit --no-verify` and `git push --no-verify`. If a hook is wrong, fix the hook with the user's permission.
- Editing PNGs under `<project>/snapshots/` directly. Always go through `npm run vrt:approve`.
- Recording a large baseline diff silently. Surface the diff to the user first.

## Sanity Commands

- `node scripts/vrt-hook.mjs --all`
- `node scripts/lint-hook.mjs --all`
- `npm run html:audit`
- `jq '.summary' .vrt-output/report/results.json`
