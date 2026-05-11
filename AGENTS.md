# Codex Operating Guide For design-blueprint

Codex acts on files via `apply_patch`. The same invariants and review loop as `CLAUDE.md` apply.

## When Editing HTML

- The implementation repo for each design is named identically to the directory under this repo root.
- Always read `<project>/spec.md` before patching `<project>/index.html`.
- After patching, stage the changed HTML and commit. Pre-commit runs lint and VRT on staged projects only.

## When VRT Fails

Use the paths in `.vrt-output/report/results.json`:

1. Identify entries with `"type": "changed"`.
2. Read the 3-pane comparison PNG from `compare_file_path`.
3. Read `golden_file_path`, `actual_file_path`, and `spec_path`.
4. Reason about whether the diff matches the textual spec.
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

1. Create `<repo-name>/index.html`, `<repo-name>/spec.md`, and `<repo-name>/pages.json` at the repository root.
2. Stage `<repo-name>/` and commit. The first commit records the baseline automatically.
