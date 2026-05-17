# Gotchas Patterns

Detection rules applied by `scripts/apply-gotchas.sh`. Documentation only; shell encodes the same rules.

## PRE_RELEASE

- Input: `package.json` `dependencies`, `devDependencies`, `optionalDependencies`, and `peerDependencies`
- Regex: value matches `-(alpha|beta|rc|next|canary|dev)`
- Report: Warnings → "Pre-release API stability: <package>=<range>"

## MAJOR_BUMP

- Input: each package in facts.json
- Rule: semver major differs between `old_version` and `new_version` (strip leading `v`)
- Report: Warnings → "Major: <coord> <old> → <new>"; activates Phase B context7 migration guide

## GROUP_DRIFT

- Input: PR title group name + `renovate.json` `packageRules[].groupName`
- Rule: `group_name` from PR title is non-null and not in renovate.json groups
- Report: Warnings → "PR group '<name>' not found in renovate.json"

## VULN_ALERT

- Input: PR title / body
- Rule: title contains `[SECURITY]` (case-insensitive) or body contains `isVulnerabilityAlert`
- Report: Security section → "Security advisory; urgent merge recommended"

## MISSING_RELEASE_NOTES

- Input: facts.json
- Rule: every `packages[].release_notes_raw` is empty
- Report: Warnings → "All packages empty; fallback required"; sets Data Source
