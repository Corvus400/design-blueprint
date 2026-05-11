# design-blueprint

HTML design repository for project-specific design blueprints.

This repository will gate HTML design changes with local linting and Visual Regression Testing (VRT). The full VRT workflow is added in later setup phases.

## Repository Layout

- Each top-level project directory maps to an implementation repository.
- A directory becomes VRT-managed when it contains `pages.json`.
- Baseline screenshots live under `<project>/snapshots/chromium/`.

## Local Files

Generated output and local tool state are ignored:

- `node_modules/`
- `.vrt-output/`
- local environment files
- `.claude/settings.local.json`
