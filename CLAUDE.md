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

## HTML Audit Rules

- `scripts/html-audit.mjs` reads `scripts/html-audit-rules/*.json` and performs DOM-based structural checks for matching HTML files.
- Use audit rules for repo-specific invariants that htmlhint cannot know, such as forbidden stale selectors, required parent-child placement, TOC/section alignment, or data-shape constraints from an implementation repo.
- When repeated manual checks are needed during a large HTML repair, add a narrow audit rule and run `npm run html:audit` before VRT.

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
