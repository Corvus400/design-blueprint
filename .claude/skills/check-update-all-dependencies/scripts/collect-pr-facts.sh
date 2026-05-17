#!/usr/bin/env bash
# Phase A deterministic collector. Never fails hard; sets _parse_failed on uncertainty.
# shellcheck disable=SC2016  # awk programs use $ for field variables, not shell expansion
set -u -o pipefail

REPO="${1:?repo required}"
PR="${2:?pr number required}"

# 1. Fetch PR metadata
PR_JSON="$(gh api "repos/$REPO/pulls/$PR" 2>/dev/null || echo '{}')"
TITLE="$(jq -r '.title // ""' <<<"$PR_JSON")"
BODY="$(jq -r '.body // ""' <<<"$PR_JSON")"

if [ -z "$BODY" ]; then
  jq -n --arg pr "$PR" --arg title "$TITLE" '{
    pr_number: ($pr|tonumber), title: $title, group_name: null,
    is_vulnerability_alert: false, packages: [],
    _parse_failed: true, _raw_body: null,
    _note: "empty body or fetch failed"
  }'
  exit 0
fi

# 2. Fetch diff
DIFF="$(gh pr diff --repo "$REPO" "$PR" 2>/dev/null || true)"

# 3. Group name from title
GROUP_NAME="$(printf '%s' "$TITLE" \
  | sed -E 's/^(chore|fix|feat)\(deps\):[[:space:]]*update[[:space:]]+(.*)$/\2/I' \
  | sed -E 's/[[:space:]]*\((major|minor|patch)\)$//I')"

# 4. Vulnerability flag
IS_VULN=false
if printf '%s' "$TITLE" | grep -qiE '\[SECURITY\]|vulnerability'; then IS_VULN=true; fi
if printf '%s' "$BODY"  | grep -qiE 'isVulnerabilityAlert|security advisory'; then IS_VULN=true; fi

# 5. Extract package table rows
PARSE_FAILED=false

TABLE_LINES="$(printf '%s' "$BODY" | awk '
  /^\| Package \|/ { intable=1; next }
  intable && /^\|[[:space:]]*---/ { next }
  intable && /^$/ { intable=0 }
  intable && /^\| / { print }
')"

SOURCE_COL="$(printf '%s' "$BODY" | awk -F'|' '
  /^\| Package \|/ {
    for (i=1; i<=NF; i++) {
      cell=$i
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", cell)
      if (cell == "Source") { print i; exit }
    }
  }
')"

[ -z "$TABLE_LINES" ] && PARSE_FAILED=true

pkgs_tmp="$(mktemp)"
printf '[]' > "$pkgs_tmp"

while IFS= read -r row; do
  [ -z "$row" ] && continue

  pkg_cell="$(printf '%s' "$row" | awk -F'|' '{print $2}' | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')"
  coord="$(printf '%s' "$pkg_cell" | sed -nE 's/^\[([^]]+)\].*$/\1/p')"
  [ -z "$coord" ] && coord="$(printf '%s' "$pkg_cell" | sed -E 's/^`?([^`[:space:]]+)`?.*$/\1/')"

  change_cell="$(printf '%s' "$row" | awk -F'|' '{print $3}')"
  old_v="$(printf '%s' "$change_cell" | sed -nE 's/.*`([^`]+)`[[:space:]]*→[[:space:]]*`([^`]+)`.*/\1/p')"
  new_v="$(printf '%s' "$change_cell" | sed -nE 's/.*`([^`]+)`[[:space:]]*→[[:space:]]*`([^`]+)`.*/\2/p')"

  src_url=""
  if [ -n "$SOURCE_COL" ]; then
    src_cell="$(printf '%s' "$row" | awk -F'|' -v col="$SOURCE_COL" '{print $col}' | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')"
    src_url="$(printf '%s' "$src_cell" | sed -nE 's/.*\(([^)]+)\).*/\1/p')"
    [ "$src_url" = "—" ] && src_url=""
  fi

  # Release notes block
  notes="$(printf '%s' "$BODY" | awk -v key="$coord" '
    BEGIN { in_details=0; capture=0; buf="" }
    /<details>/   { in_details=1; next }
    /<\/details>/ { if (capture) { print buf; exit } in_details=0; capture=0; buf=""; next }
    in_details && /<summary>/ { if (index($0, key) > 0) { capture=1 } next }
    capture { buf = buf $0 "\n" }
  ')"

  cmp_url="$(printf '%s' "$notes" | grep -oE 'https://[^)]*compare[^)]*' | head -1)"
  if [ -z "$cmp_url" ] && [ -n "$old_v" ]; then
    cmp_url="$(printf '%s' "$BODY" | grep -oE "https://[^)]*compare[^)]*${old_v//./\\.}[^)]*" | head -1)"
  fi

  pkg_file=""
  if [ -n "$DIFF" ] && [ -n "$new_v" ]; then
    pkg_file="$(printf '%s' "$DIFF" \
      | awk -v version="$new_v" '/^diff --git /{f=$4} /^[+-][^+-]/{if (index($0, version) > 0) {print f; exit}}' \
      | sed 's|^b/||')"
  fi

  pkgs="$(jq --arg c "$coord" --arg o "$old_v" --arg n "$new_v" --arg s "$src_url" \
             --arg cu "$cmp_url" --arg pf "$pkg_file" --arg rn "$notes" '
    . + [{coordinate:$c, old_version:$o, new_version:$n,
          source_url:$s, compare_url:$cu, package_file:$pf, release_notes_raw:$rn}]
  ' "$pkgs_tmp")"
  printf '%s' "$pkgs" > "$pkgs_tmp"
done <<<"$TABLE_LINES"

PACKAGES_JSON="$(cat "$pkgs_tmp")"
rm -f "$pkgs_tmp"

# 6. Emit
jq -n --arg pr "$PR" --arg title "$TITLE" --arg group "$GROUP_NAME" \
      --argjson vuln "$IS_VULN" --argjson pkgs "$PACKAGES_JSON" \
      --argjson parse_failed "$PARSE_FAILED" --arg body "$BODY" '
{
  pr_number: ($pr|tonumber),
  title: $title,
  group_name: (if $group == "" then null else $group end),
  is_vulnerability_alert: $vuln,
  packages: $pkgs,
  _parse_failed: $parse_failed,
  _raw_body: (if $parse_failed then $body else null end)
}
'
