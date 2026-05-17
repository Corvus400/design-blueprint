#!/usr/bin/env bash
# Phase A gotchas detector. stdin: facts JSON. stdout: warnings JSON.
set -u -o pipefail

PACKAGE_JSON="${1:?package.json path required}"
RENOVATE_JSON="${2:?renovate.json path required}"

FACTS="$(cat)"

warnings='[]'
add() {
  local code="$1"; local pkg="$2"; local note="$3"
  warnings="$(jq --arg c "$code" --arg p "$pkg" --arg n "$note" \
    '. + [{code:$c, package:$p, note:$n}]' <<<"$warnings")"
}

# PRE_RELEASE
if [ -f "$PACKAGE_JSON" ]; then
  while IFS= read -r row; do
    [ -z "$row" ] && continue
    key="$(jq -r '.key' <<<"$row")"
    ver="$(jq -r '.value' <<<"$row")"
    add "PRE_RELEASE" "$key" "version=$ver is a pre-release"
  done < <(jq -c '
    [
      .dependencies // {},
      .devDependencies // {},
      .optionalDependencies // {},
      .peerDependencies // {}
    ]
    | add
    | to_entries[]
    | select(.value | test("-(alpha|beta|rc|next|canary|dev)"; "i"))
  ' "$PACKAGE_JSON")
fi

# MAJOR_BUMP
while read -r row; do
  [ -z "$row" ] && continue
  coord="$(jq -r '.coordinate' <<<"$row")"
  old="$(jq -r '.old_version' <<<"$row")"
  new="$(jq -r '.new_version' <<<"$row")"
  om="$(printf '%s' "$old" | sed -E 's/^v?([0-9]+).*/\1/')"
  nm="$(printf '%s' "$new" | sed -E 's/^v?([0-9]+).*/\1/')"
  [[ -z "$om" || -z "$nm" ]] && continue
  if [ "$om" != "$nm" ]; then
    add "MAJOR_BUMP" "$coord" "major: $old → $new"
  fi
done < <(jq -c '.packages[]' <<<"$FACTS")

# GROUP_DRIFT
pr_group="$(jq -r '.group_name // empty' <<<"$FACTS")"
if [ -n "$pr_group" ]; then
  known="$(jq -r '.packageRules[].groupName // empty' "$RENOVATE_JSON" | sort -u)"
  if ! printf '%s\n' "$known" | grep -Fxq "$pr_group"; then
    case "$pr_group" in
      *"update "*|*"Update "*) : ;;
      *) add "GROUP_DRIFT" "" "PR group '$pr_group' not in renovate.json" ;;
    esac
  fi
fi

# VULN_ALERT
if [ "$(jq -r '.is_vulnerability_alert' <<<"$FACTS")" = "true" ]; then
  add "VULN_ALERT" "" "security advisory; urgent merge recommended"
fi

# MISSING_RELEASE_NOTES
empty_count="$(jq '[.packages[] | select(.release_notes_raw == "")] | length' <<<"$FACTS")"
total_count="$(jq '.packages | length' <<<"$FACTS")"
if [ "$total_count" -gt 0 ] && [ "$empty_count" -eq "$total_count" ]; then
  add "MISSING_RELEASE_NOTES" "" "all packages empty; fallback required"
fi

jq -n --argjson w "$warnings" '{warnings: $w}'
