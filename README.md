# design-blueprint

HTML design repository with **pre-commit + pre-push VRT** and built-in **AI visual review** for Claude Code / Codex.

## Layout

- Each design lives in a top-level directory whose name matches the implementation repository, for example `fictional-drug-and-disease-ref-flutter/`.
- A directory is considered a VRT-managed project if and only if it contains `pages.json`.
- Per-project files: `index.html`, `spec.md`, `pages.json`, `snapshots/chromium/<page>.png` (baselines, git-tracked).

## Setup

Run this on every clone:

```sh
npm install
npx playwright install chromium
```

The `prepare` script in `package.json` runs `husky`, which wires Git hooks. Without `npm install`, commits and pushes can bypass VRT.

## Daily Workflow

1. Edit HTML inside `<project>/`.
2. Stage the changed HTML.
3. Commit. The pre-commit hook runs prettier, htmlhint, any matching HTML audit rules, and VRT on staged projects.
4. Push. The pre-push hook re-runs lint, HTML audit rules, and VRT across all projects.

## HTML Audit Rules

Use `npm run html:audit` for DOM-based structural checks that are too repo-specific for htmlhint or VRT. Rule files live in `scripts/html-audit-rules/*.json` and can forbid stale selectors/text, require parent-child structure, and keep TOC anchors aligned with sections.

When editing a large spec HTML, prefer adding or updating an audit rule over relying on repeated manual `rg` checks. Keep rules page-specific and focused on invariants that would otherwise cause implementation hallucinations.

## First-Time Commit For A New Project

The first commit auto-records the captured PNG as the baseline. Treat that baseline as a starting point, not the truth: review it against `spec.md` and adjust HTML iteratively. See `CLAUDE.md` for the AI-driven review loop.

## When VRT Fails

The hook prints comparison image paths and exits non-zero. Ask Claude Code or Codex:

> VRT failed. Read `.vrt-output/comparison/<project>/<page>.png` and `<project>/spec.md`, then output JSON `{ "fulfillment_percent": <0-100>, "explanation": "..." }`.

To accept the diff as the new baseline:

```sh
npm run vrt:approve -- --project <project> --page <page>
git commit
```

## Single-Machine Prerequisite

Pixel snapshots depend on OS, Chromium version, font rendering, and `deviceScaleFactor`. This repo is wired with `deviceScaleFactor: 1` and Chromium, but cross-machine pixel parity is not guaranteed. Use one machine, the one that recorded the baseline, as authoritative.

## Forbidden Actions

- `git commit --no-verify` bypasses lint and VRT.
- `git push --no-verify` bypasses pre-push.
- Manual edits to `<project>/snapshots/` PNGs. Always use `npm run vrt:approve`.
- External CDN fonts or scripts inside design HTML. Self-host or inline them because network calls make VRT flaky and slow.

## Adding A New Project

1. Create `<repo-name>/index.html`, `<repo-name>/spec.md`, and `<repo-name>/pages.json` at the repository root. Use the implementation repo name verbatim.
2. Stage `<repo-name>/` and commit. The first VRT run records the baseline automatically.

## Re-Staging Note

`lint-hook.mjs --staged` reads file contents from the working tree, not the staged index. If you stage a file and then edit it again before committing, stage it again before `git commit`.
