import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

const REPO_ROOT = process.cwd();
const allowedEmailHosts = new Set(["users.noreply.github.com"]);
const privateKeyMarker = String.fromCharCode(66, 69, 71, 73, 78, 32, 80, 82, 73, 86, 65, 84, 69, 32, 75, 69, 89);
const binaryExtensions = new Set([
  ".gif",
  ".ico",
  ".jpg",
  ".jpeg",
  ".otf",
  ".png",
  ".ttf",
  ".webp",
  ".woff",
  ".woff2",
]);

function git(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function isProbablyBinary(file, bytes) {
  if (binaryExtensions.has(path.extname(file).toLowerCase())) return true;
  return bytes.includes(0);
}

function issue(message, detail = "") {
  return detail ? `${message}: ${detail}` : message;
}

function scanText(text, source) {
  const findings = [];
  const forbiddenFragments = [
    ["/" + "Users/", "local absolute path"],
    ["file" + ":///", "local file URL"],
    ["github_" + "pat_", "GitHub fine-grained token marker"],
    ["gh" + "p_", "GitHub classic token marker"],
    ["sk" + "-", "OpenAI-style secret key marker"],
    [privateKeyMarker, "private key marker"],
    ["CONTEXT7_" + "API_KEY", "Context7 API key variable marker"],
    ["OPENAI_" + "API_KEY", "OpenAI API key variable marker"],
  ];

  for (const [fragment, label] of forbiddenFragments) {
    if (text.includes(fragment)) findings.push(issue(`${source} contains ${label}`, fragment));
  }

  const emailPattern = /[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
  for (const match of text.matchAll(emailPattern)) {
    const host = match[1].toLowerCase();
    if (!allowedEmailHosts.has(host)) {
      findings.push(issue(`${source} contains non-noreply email`, match[0]));
    }
  }

  return findings;
}

async function trackedFiles() {
  return git(["ls-files", "-z"])
    .split("\0")
    .filter(Boolean);
}

async function auditTrackedFiles() {
  const findings = [];
  for (const file of await trackedFiles()) {
    const bytes = await readFile(path.join(REPO_ROOT, file));
    if (isProbablyBinary(file, bytes)) continue;
    findings.push(...scanText(bytes.toString("utf8"), file));
  }
  return findings;
}

function auditAuthorEmails() {
  const findings = [];
  const output = git(["log", "--all", "--format=%ae"]);
  for (const email of new Set(output.split("\n").filter(Boolean))) {
    const host = email.split("@")[1]?.toLowerCase() ?? "";
    if (!allowedEmailHosts.has(host)) {
      findings.push(issue("git history contains non-noreply author email", email));
    }
  }
  return findings;
}

function auditHistoryContent() {
  const findings = [];
  const patterns = [
    ["/" + "Users/", "local absolute path"],
    ["github_" + "pat_", "GitHub fine-grained token marker"],
    ["gh" + "p_", "GitHub classic token marker"],
    ["sk" + "-", "OpenAI-style secret key marker"],
    [privateKeyMarker, "private key marker"],
  ];

  for (const [pattern, label] of patterns) {
    const result = spawnSync("git", ["log", "--all", "--oneline", `-G${pattern}`, "--max-count=20"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    if (result.status !== 0) {
      throw new Error(`git log -G check failed for ${label}: ${result.stderr || result.stdout}`);
    }
    if (result.stdout.trim()) {
      findings.push(issue(`git history contains ${label}`, result.stdout.trim()));
    }
  }

  return findings;
}

function selfTest() {
  const clean = "Corvus400 <13657682+Corvus400@users.noreply.github.com>\nhttps://github.com/Corvus400/design-blueprint";
  const dirty = [
    "/" + "Users/example/project/file.txt",
    "someone" + "@" + "example.com",
    "github_" + "pat_example",
    "gh" + "p_example",
    "sk" + "-example",
    privateKeyMarker,
  ].join("\n");
  const cleanFindings = scanText(clean, "clean-fixture");
  const dirtyFindings = scanText(dirty, "dirty-fixture");

  if (cleanFindings.length !== 0) {
    throw new Error(`clean fixture unexpectedly failed:\n${cleanFindings.join("\n")}`);
  }
  if (dirtyFindings.length < 6) {
    throw new Error(`dirty fixture missed expected findings:\n${dirtyFindings.join("\n")}`);
  }
  console.log("[public-audit-selftest] OK");
}

async function main() {
  if (process.argv.includes("--selftest")) {
    selfTest();
    return;
  }

  const findings = [
    ...(await auditTrackedFiles()),
    ...auditAuthorEmails(),
    ...auditHistoryContent(),
  ];

  if (findings.length > 0) {
    console.error(`[public-audit] ${findings.length} finding(s):`);
    for (const finding of findings) console.error(`  - ${finding}`);
    process.exit(1);
  }

  console.log("[public-audit] OK");
}

await main();
