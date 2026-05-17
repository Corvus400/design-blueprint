import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const DEFAULT_SESSIONS_DIR = path.join(os.homedir(), ".codex", "sessions");
const DEFAULT_SUMMARIES_DIR = path.join(os.homedir(), ".codex", "memories", "rollout_summaries");

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
];

function parseArgs(argv) {
  const options = {
    repo: process.cwd(),
    sessionsDir: DEFAULT_SESSIONS_DIR,
    summariesDir: DEFAULT_SUMMARIES_DIR,
    summary: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo") options.repo = path.resolve(argv[(index += 1)]);
    else if (arg === "--sessions-dir") options.sessionsDir = path.resolve(argv[(index += 1)]);
    else if (arg === "--summaries-dir") options.summariesDir = path.resolve(argv[(index += 1)]);
    else if (arg === "--summary") options.summary = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: session-conflict-audit.mjs [--repo <path>] [--sessions-dir <path>] [--summaries-dir <path>] [--summary]",
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

async function analyzeSession(file, repoRoot) {
  const raw = await readFile(file, "utf8");
  const lines = raw.split(/\n/).filter(Boolean);
  const first = safeJson(lines[0]);
  if (first?.type !== "session_meta") return null;
  const cwd = first.payload?.cwd;
  if (path.resolve(cwd ?? "") !== repoRoot) return null;

  const session = {
    id: first.payload?.id ?? path.basename(file, ".jsonl"),
    file,
    cwd,
    user_messages: 0,
    assistant_messages: 0,
    function_calls: 0,
    categories: Object.fromEntries(CATEGORIES.map((category) => [category.id, 0])),
  };

  for (const line of lines) {
    const item = safeJson(line);
    if (!item) continue;
    if (item.type === "response_item" && item.payload?.type === "function_call") session.function_calls += 1;
    if (item.type !== "response_item" || item.payload?.type !== "message") continue;
    const role = item.payload.role;
    if (role === "user") session.user_messages += 1;
    if (role === "assistant") session.assistant_messages += 1;
    if (role !== "user") continue;
    const text = textFromContent(item.payload.content);
    for (const category of bucketFor(text)) session.categories[category] += 1;
  }

  return session;
}

async function analyzeSummary(file, repoRoot) {
  const raw = await readFile(file, "utf8");
  const cwdMatch = raw.match(/^cwd:\s*(.+)$/m);
  if (!cwdMatch || path.resolve(cwdMatch[1].trim()) !== repoRoot) return null;
  const idMatch = raw.match(/^thread_id:\s*(.+)$/m);
  const categories = Object.fromEntries(CATEGORIES.map((category) => [category.id, 0]));
  for (const category of bucketFor(raw)) categories[category] += 1;
  return {
    id: idMatch?.[1]?.trim() ?? path.basename(file, ".md"),
    file,
    categories,
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

  const sessionFiles = await walkFiles(options.sessionsDir, (file) => file.endsWith(".jsonl"));
  const summaryFiles = await walkFiles(options.summariesDir, (file) => file.endsWith(".md"));

  const sessions = (await Promise.all(sessionFiles.map((file) => analyzeSession(file, repoRoot)))).filter(Boolean);
  const summaries = (await Promise.all(summaryFiles.map((file) => analyzeSummary(file, repoRoot)))).filter(Boolean);

  const result = {
    repo: repoRoot,
    generated_at: new Date().toISOString(),
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
      count: summaries.length,
      categories: aggregate(summaries),
      summaries: summaries.map((summary) => ({
        id: summary.id,
        categories: summary.categories,
      })),
    },
    category_labels: Object.fromEntries(CATEGORIES.map((category) => [category.id, category.label])),
    privacy_note: "Raw transcript text is read only for local categorization and is not emitted.",
  };

  if (options.summary) {
    console.log(
      JSON.stringify(
        {
          repo: result.repo,
          raw_session_count: result.raw_sessions.count,
          memory_summary_count: result.memory_summaries.count,
          raw_categories: result.raw_sessions.categories,
          memory_categories: result.memory_summaries.categories,
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

await main();
