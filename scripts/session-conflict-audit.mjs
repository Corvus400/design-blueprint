import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_SESSIONS_DIR = path.join(os.homedir(), ".codex", "sessions");
const DEFAULT_SUMMARIES_DIR = path.join(os.homedir(), ".codex", "memories", "rollout_summaries");
const GENERIC_ALIAS_STOPLIST = new Set([
  "design system",
  "elevation",
  "hero",
  "iconography",
  "index",
  "radii",
  "skills",
]);

const CATEGORIES = [
  {
    id: "all_ui_visual_coverage",
    label: "All UI visual coverage was missing",
    patterns: [/全UI/, /全.*スクリーンショット/, /全部.*撮/, /一部しか画像/, /VRT結果やplaywright/, /computer use/i],
  },
  {
    id: "visual_issue_missed",
    label: "Visible layout issue was missed or accepted",
    patterns: [/表示.*崩/, /何も変わっていません/, /修正されていません/, /横幅が狭/, /おかしく/, /気づけ/],
  },
  {
    id: "ssot_inference",
    label: "Implementation SSOT was skipped in favor of inference",
    patterns: [/実装.*SSOT/, /推測でまず行動するな/, /ソースが明確/, /実装と異な/, /閲覧履歴.*SSOT.*ダメ/],
  },
  {
    id: "wrong_contract_encoded",
    label: "Wrong contract was encoded as a guardrail",
    patterns: [/PASS扱いになってはダメ/, /間違った仕様を検証/, /再発防止策/, /どんどんデザイン仕様書を壊/],
  },
  {
    id: "stage_revert_confusion",
    label: "Staging, reverting, or destructive cleanup needed clarification",
    patterns: [/ステージ状態だけ解除/, /変更そのものを無かったこと/, /破壊的変更/, /余計な削除/, /指示していない余計/],
  },
  {
    id: "goal_branch_workflow",
    label: "Goal wording, branch strategy, or PR workflow was underspecified",
    patterns: [/ブランチ戦略/, /ゴールの文章/, /Goal/, /PR/, /ruleset/, /mainに直接/],
  },
  {
    id: "micro_management_signal",
    label: "The user had to micromanage repeated failed fixes",
    patterns: [/マイクロマネジメント/, /何度も/, /イライラ/, /節穴/, /闇雲/, /一度冷静/],
  },
  {
    id: "approximation_used",
    label: "Approximation was used where exact implementation parity was required",
    patterns: [/近似/, /実装と同じ/, /実際のもの/, /グリフ/, /同じにしろ/, /exact/i],
  },
  {
    id: "invented_ui_surface",
    label: "A UI surface not owned by the implementation was invented",
    patterns: [/実装に存在しない/, /架空UI/, /架空 UI/, /Other app/, /neighbor/i, /独自実装キーボード/],
  },
  {
    id: "implementation_parity_gap",
    label: "The implementation and design artifact were not compared as peers",
    patterns: [/実装と.*違/, /実装.*確認/, /ちゃんと実装/, /両方を照らし合わせ/, /SSOT/],
  },
  {
    id: "premature_visual_completion",
    label: "Visual work was treated as complete before the acceptance evidence was satisfied",
    patterns: [/コミット.*まだ/, /未達/, /勘で/, /適当な仕事/, /検証項目/, /完了扱い/],
  },
  {
    id: "real_device_evidence_gap",
    label: "Real-device or rendered evidence was required before commit or approval",
    patterns: [/実機/, /実機を操作/, /実機の見た目/, /screenshot/i, /スクリーンショット/],
  },
];

function parseArgs(argv) {
  const options = {
    repo: process.cwd(),
    sessionsDir: DEFAULT_SESSIONS_DIR,
    summariesDir: DEFAULT_SUMMARIES_DIR,
    summary: false,
    inventory: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo") options.repo = path.resolve(argv[(index += 1)]);
    else if (arg === "--sessions-dir") options.sessionsDir = path.resolve(argv[(index += 1)]);
    else if (arg === "--summaries-dir") options.summariesDir = path.resolve(argv[(index += 1)]);
    else if (arg === "--summary") options.summary = true;
    else if (arg === "--inventory") options.inventory = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: session-conflict-audit.mjs [--repo <path>] [--sessions-dir <path>] [--summaries-dir <path>] [--summary] [--inventory]",
      );
      process.exit(0);
    }
  }
  return options;
}

async function walkFiles(dir, predicate) {
  if (!existsSync(dir)) return [];
  const out = [];
  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && predicate(full)) out.push(full);
    }
  }
  await walk(dir);
  return out.sort();
}

function safeJson(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function textFromContent(content) {
  if (!Array.isArray(content)) return "";
  return content.map((item) => item.text ?? item.output_text ?? "").join("\n");
}

function bucketFor(text) {
  const hits = [];
  for (const category of CATEGORIES) {
    if (category.patterns.some((pattern) => pattern.test(text))) hits.push(category.id);
  }
  return hits;
}

function addAlias(aliases, value) {
  const alias = `${value ?? ""}`.trim();
  if (GENERIC_ALIAS_STOPLIST.has(alias.toLowerCase())) return;
  if (alias.length >= 4) aliases.add(alias);
}

function githubSlugFromRemote(remoteUrl) {
  const match = remoteUrl.match(/github\.com[:/]([^/\s]+\/[^/\s.]+)(?:\.git)?/);
  return match?.[1] ?? null;
}

async function collectRepoAliases(repoRoot) {
  const aliases = new Set([repoRoot, path.basename(repoRoot)]);

  const gitConfigPath = path.join(repoRoot, ".git", "config");
  if (existsSync(gitConfigPath)) {
    const gitConfig = await readFile(gitConfigPath, "utf8");
    const originUrl = gitConfig.match(/^\s*url\s*=\s*(.+)$/m)?.[1]?.trim();
    const githubSlug = githubSlugFromRemote(originUrl ?? "");
    addAlias(aliases, githubSlug);
    addAlias(aliases, githubSlug?.split("/").at(-1));
  }

  const entries = await readdir(repoRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pagesPath = path.join(repoRoot, entry.name, "pages.json");
    if (!existsSync(pagesPath)) continue;
    addAlias(aliases, entry.name);
    const pagesJson = safeJson(await readFile(pagesPath, "utf8"));
    for (const page of pagesJson?.pages ?? []) {
      addAlias(aliases, page.name);
      if (typeof page.file === "string") {
        addAlias(aliases, path.basename(page.file, path.extname(page.file)));
      }
    }
  }

  return [...aliases].sort();
}

function findRepoMentions(text, aliases) {
  return aliases.filter((needle) => text.includes(needle));
}

function includesRepoMention(text, aliases) {
  return findRepoMentions(text, aliases).length > 0;
}

function parseToolArguments(value) {
  if (typeof value !== "string") return value ?? {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function hasRepoWorkdirMention(argumentsValue, aliases) {
  const parsed = parseToolArguments(argumentsValue);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
  return typeof parsed.workdir === "string" && includesRepoMention(parsed.workdir, aliases);
}

function countValues(values) {
  return values.reduce((sum, value) => sum + value, 0);
}

async function analyzeSession(file, repoRoot, aliases) {
  const raw = await readFile(file, "utf8");
  const lines = raw.split(/\n/).filter(Boolean);
  const first = safeJson(lines[0]);
  if (first?.type !== "session_meta") return null;
  const cwd = first.payload?.cwd;
  const cwdExact = path.resolve(cwd ?? "") === repoRoot;

  const session = {
    id: first.payload?.id ?? path.basename(file, ".jsonl"),
    file,
    cwd,
    match_reasons: cwdExact ? ["cwd_exact"] : [],
    user_messages: 0,
    assistant_messages: 0,
    function_calls: 0,
    categories: Object.fromEntries(CATEGORIES.map((category) => [category.id, 0])),
    inventory_categories: Object.fromEntries(CATEGORIES.map((category) => [category.id, 0])),
    message_mentions: {
      user: 0,
      assistant: 0,
    },
    alias_mention_count: 0,
    tool_workdir_mentions: 0,
    parse_failures: 0,
  };

  for (const line of lines) {
    const item = safeJson(line);
    if (!item) {
      session.parse_failures += 1;
      continue;
    }
    if (item.type === "response_item" && item.payload?.type === "function_call") {
      session.function_calls += 1;
      if (hasRepoWorkdirMention(item.payload.arguments, aliases)) {
        session.tool_workdir_mentions += 1;
        if (!session.match_reasons.includes("tool_workdir_repo_mention")) {
          session.match_reasons.push("tool_workdir_repo_mention");
        }
      }
    }
    if (item.type !== "response_item" || item.payload?.type !== "message") continue;
    const role = item.payload.role;
    if (role === "user") session.user_messages += 1;
    if (role === "assistant") session.assistant_messages += 1;
    const text = textFromContent(item.payload.content);
    if (role === "user" || role === "assistant") {
      const mentions = findRepoMentions(text, aliases);
      if (mentions.length > 0) {
        session.message_mentions[role] += 1;
        session.alias_mention_count += mentions.length;
        const reason = `${role}_message_repo_mention`;
        if (!session.match_reasons.includes(reason)) session.match_reasons.push(reason);
      }
    }
    if (role === "user") {
      for (const category of bucketFor(text)) {
        session.inventory_categories[category] += 1;
        if (cwdExact) session.categories[category] += 1;
      }
    }
  }

  return session;
}

async function analyzeSummary(file, repoRoot, aliases) {
  const raw = await readFile(file, "utf8");
  const cwdMatch = raw.match(/^cwd:\s*(.+)$/m);
  const cwdExact = Boolean(cwdMatch && path.resolve(cwdMatch[1].trim()) === repoRoot);
  const repoMention = includesRepoMention(raw, aliases);
  if (!cwdExact && !repoMention) return null;
  const idMatch = raw.match(/^thread_id:\s*(.+)$/m);
  const categories = Object.fromEntries(CATEGORIES.map((category) => [category.id, 0]));
  const inventoryCategories = Object.fromEntries(CATEGORIES.map((category) => [category.id, 0]));
  for (const category of bucketFor(raw)) categories[category] += 1;
  for (const category of bucketFor(raw)) inventoryCategories[category] += 1;
  return {
    id: idMatch?.[1]?.trim() ?? path.basename(file, ".md"),
    file,
    match_reasons: [cwdExact ? "cwd_exact" : null, repoMention ? "repo_mention" : null].filter(Boolean),
    categories: cwdExact ? categories : Object.fromEntries(CATEGORIES.map((category) => [category.id, 0])),
    inventory_categories: inventoryCategories,
  };
}

function aggregate(items) {
  const categories = Object.fromEntries(CATEGORIES.map((category) => [category.id, 0]));
  for (const item of items) {
    for (const [id, count] of Object.entries(item.categories)) categories[id] += count;
  }
  return categories;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(options.repo);
  const repoStats = await stat(repoRoot);
  if (!repoStats.isDirectory()) throw new Error(`--repo is not a directory: ${repoRoot}`);
  const aliases = await collectRepoAliases(repoRoot);

  const sessionFiles = await walkFiles(options.sessionsDir, (file) => file.endsWith(".jsonl"));
  const summaryFiles = await walkFiles(options.summariesDir, (file) => file.endsWith(".md"));

  const allSessions = (await Promise.all(sessionFiles.map((file) => analyzeSession(file, repoRoot, aliases)))).filter(
    Boolean,
  );
  const sessions = allSessions.filter((session) => session.match_reasons.includes("cwd_exact"));
  const inventorySessions = allSessions.filter((session) => session.match_reasons.length > 0);
  const summaries = (await Promise.all(summaryFiles.map((file) => analyzeSummary(file, repoRoot, aliases)))).filter(
    Boolean,
  );
  const exactSummaries = summaries.filter((summary) => summary.match_reasons.includes("cwd_exact"));

  const result = {
    repo: repoRoot,
    generated_at: new Date().toISOString(),
    coverage: {
      session_files_scanned: sessionFiles.length,
      summary_files_scanned: summaryFiles.length,
      session_parse_failures: allSessions.reduce((sum, session) => sum + session.parse_failures, 0),
      alias_count: aliases.length,
      aliases,
    },
    raw_sessions: {
      count: sessions.length,
      categories: aggregate(sessions),
      sessions: sessions.map((session) => ({
        id: session.id,
        user_messages: session.user_messages,
        assistant_messages: session.assistant_messages,
        function_calls: session.function_calls,
        categories: session.categories,
      })),
    },
    memory_summaries: {
      count: exactSummaries.length,
      categories: aggregate(exactSummaries),
      summaries: exactSummaries.map((summary) => ({
        id: summary.id,
        categories: summary.categories,
      })),
    },
    inventory: {
      note: "cwd_exact is the authoritative session set. Repo mentions are candidate records for completeness checks and may include false positives.",
      raw_sessions: {
        cwd_exact_count: sessions.length,
        candidate_mention_count: inventorySessions.length - sessions.length,
        total_inventory_count: inventorySessions.length,
        categories: aggregate(
          inventorySessions.map((session) => ({
            categories: session.inventory_categories,
          })),
        ),
        sessions: inventorySessions.map((session) => ({
          id: session.id,
          match_reasons: session.match_reasons,
          user_messages: session.user_messages,
          assistant_messages: session.assistant_messages,
          function_calls: session.function_calls,
          message_mentions: session.message_mentions,
          alias_mention_count: session.alias_mention_count,
          tool_workdir_mentions: session.tool_workdir_mentions,
          parse_failures: session.parse_failures,
          category_hit_count: countValues(Object.values(session.inventory_categories)),
          categories: session.inventory_categories,
        })),
      },
      memory_summaries: {
        cwd_exact_count: exactSummaries.length,
        candidate_mention_count: summaries.length - exactSummaries.length,
        total_inventory_count: summaries.length,
        categories: aggregate(
          summaries.map((summary) => ({
            categories: summary.inventory_categories,
          })),
        ),
        summaries: summaries.map((summary) => ({
          id: summary.id,
          match_reasons: summary.match_reasons,
          category_hit_count: countValues(Object.values(summary.inventory_categories)),
          categories: summary.inventory_categories,
        })),
      },
    },
    category_labels: Object.fromEntries(CATEGORIES.map((category) => [category.id, category.label])),
    privacy_note: "Raw transcript text is read only for local categorization and is not emitted.",
  };

  if (options.inventory) {
    console.log(JSON.stringify(result.inventory, null, 2));
  } else if (options.summary) {
    console.log(
      JSON.stringify(
        {
          repo: result.repo,
          raw_session_count: result.raw_sessions.count,
          memory_summary_count: result.memory_summaries.count,
          inventory_raw_session_count: result.inventory.raw_sessions.total_inventory_count,
          inventory_memory_summary_count: result.inventory.memory_summaries.total_inventory_count,
          coverage: result.coverage,
          raw_categories: result.raw_sessions.categories,
          memory_categories: result.memory_summaries.categories,
          inventory_categories: {
            raw_sessions: result.inventory.raw_sessions.categories,
            memory_summaries: result.inventory.memory_summaries.categories,
          },
          privacy_note: result.privacy_note,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
