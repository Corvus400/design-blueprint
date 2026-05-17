# Codex Operating Guide For design-blueprint

Codex acts on files via `apply_patch`. The same invariants and review loop as `CLAUDE.md` apply.

## When Editing HTML

- The implementation repo for each design is named identically to the directory under this repo root.
- Always read the changed page HTML registered in `<project>/pages.json` before patching it.
- Before changing protected `main`, create a feature branch and open a PR. The default-branch ruleset requires PR review flow and `ci-gate`; PR titles and bodies must be Japanese.
- After patching, stage the changed HTML and commit. Pre-commit runs lint, matching HTML audit rules, and VRT on staged projects only.
- For large or fragile HTML specs, add or update `scripts/html-audit-rules/*.json` instead of relying only on manual search. Use DOM-based audit rules for stale selectors/text, parent-child placement, TOC/section alignment, and implementation-backed invariants.

## All-State Visual Review

- For generated multi-state design specs, do not approve from a single screenshot, TOC section screenshot, DOM audit, or VRT summary. Enumerate every `[data-frame-label]` in the changed page and inspect frame screenshots for all device/theme/state patterns.
- Run `npm run visual:manifest -- --project <project> --page <page>` for changed multi-frame pages. The manifest must show `missing_capture_count: 0`; inspect the generated crops under `.vrt-output/visual-review/` before claiming visual completion.
- For search-screen changes, explicitly check empty, error, filter-open, sort-open, applied-filter results, loading, loading-more, iPhone landscape, iPad portrait, iPad landscape, and iPad Split View states. Repeated user-reported failures around icons, cards, chips, shimmer rows, sticky headers, and pane widths must become inline verification or `scripts/html-audit-rules/*.json` checks.
- If the intended source is the implementation repo, read the implementation before changing icon glyphs, card anatomy, placeholder icons, sizes, state matrices, or copy. Do not substitute browsing-history or another HTML design as SSOT unless the task explicitly says it is the SSOT.

## Design Conflict Recovery

- If the user reports that a design is broken, unchanged, visually wrong, or needs recurrence prevention, stop adding speculative fixes. First inspect `git diff`, the affected page HTML, `pages.json`, the matching audit rule, and the VRT actual/comparison output.
- For repo-wide recurrence-prevention requests, run `npm run session:conflict-audit -- --repo . --inventory` before designing guardrails. Treat `cwd_exact` sessions as authoritative and remote/project/page alias records as completeness candidates; do not emit raw transcript text.
- Separate changes into `revert mistaken change`, `keep intended change`, and `add guardrail`. Restore the previous design contract before adding new behavior when the issue was introduced by the current session.
- Do not change a page's device classes, frame count, state matrix, or responsive mode from inference alone. Record the current contract, source evidence, intended contract, and impact before editing.
- For visual design conflicts, DOM audit and VRT are not enough by themselves. Capture or inspect a rendered screenshot/crop of the affected frame before approving a VRT diff or claiming the layout is fixed.
- Encode the corrected invariant in `scripts/html-audit-rules/*.json` or an inline verification row so the same broken state cannot pass again.
- If the user says to "戻して" or "解除", distinguish unstaging from discarding changes before acting. Only remove worktree changes when the user explicitly asks to discard them.

## When VRT Fails

Use the paths in `.vrt-output/report/results.json`:

1. Identify entries with `"type": "changed"`.
2. Read the 3-pane comparison PNG from `compare_file_path`.
3. Read `golden_file_path`, `actual_file_path`, and `page_file`.
4. Reason about whether the diff matches the page HTML contract.
5. Output exactly one JSON document per changed page:

```json
{
  "project": "...",
  "page": "...",
  "fulfillment_percent": 0,
  "explanation": "..."
}
```

Recommend `npm run vrt:approve -- --project <project> --page <page>` when `fulfillment_percent >= 80` and the change matches the spec.

## Forbidden

- `git commit --no-verify` and `git push --no-verify`.
- Patches that touch `<project>/snapshots/*.png` directly. Run `npm run vrt:approve` instead.
- External CDN dependencies in design HTML.

## Adding A New Design Project

1. Create the page HTML file and `<repo-name>/pages.json` at the repository root.
2. Stage `<repo-name>/` and commit. The first commit records the baseline automatically.
