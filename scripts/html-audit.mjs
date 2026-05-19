import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EXCLUDED_DIRS, REPO_ROOT, listProjects } from "./vrt-config.mjs";
import { stagedFiles } from "./git-utils.mjs";

const require = createRequire(import.meta.url);
const HTMLParser = require("htmlhint/dist/core/htmlparser").default;
const DEFAULT_RULES_DIR = path.join(REPO_ROOT, "scripts", "html-audit-rules");
const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

async function walkHtml(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    if (entry.name === "snapshots") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkHtml(full)));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      out.push(path.relative(REPO_ROOT, full));
    }
  }
  return out;
}

async function allHtmlFiles() {
  const projects = await listProjects();
  const out = [];
  for (const project of projects) {
    out.push(...(await walkHtml(path.join(REPO_ROOT, project))));
  }
  return out;
}

async function projectHtmlFiles(project) {
  return walkHtml(path.join(REPO_ROOT, project));
}

async function loadRules(rulesDir = DEFAULT_RULES_DIR) {
  if (!existsSync(rulesDir)) return [];
  const entries = await readdir(rulesDir, { withFileTypes: true });
  const rules = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const file = path.join(rulesDir, entry.name);
    const rule = JSON.parse(await readFile(file, "utf8"));
    rules.push({ ...rule, __rulePath: path.relative(REPO_ROOT, file) });
  }
  return rules;
}

function normalizeFileForCompare(file) {
  return path.isAbsolute(file) ? path.resolve(file) : path.relative(REPO_ROOT, path.resolve(REPO_ROOT, file));
}

function matchingRules(file, rules) {
  const normalized = normalizeFileForCompare(file);
  return rules.filter((rule) => {
    if (rule.file) {
      const ruleFile = normalizeFileForCompare(rule.file);
      return ruleFile === normalized;
    }
    if (Array.isArray(rule.files)) {
      return rule.files.some((ruleFile) => normalizeFileForCompare(ruleFile) === normalized);
    }
    if (rule.filePattern) {
      return new RegExp(rule.filePattern).test(normalized);
    }
    return false;
  });
}

function parseArgs(args) {
  const options = { mode: null, file: null, project: null, rulesDir: DEFAULT_RULES_DIR };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--all") options.mode = "all";
    else if (arg === "--staged") options.mode = "staged";
    else if (arg === "--file") {
      options.mode = "file";
      options.file = args[(index += 1)];
    } else if (arg === "--project") {
      options.mode = "project";
      options.project = args[(index += 1)];
    } else if (arg === "--rules") {
      options.rulesDir = path.resolve(args[(index += 1)]);
    }
  }
  return options;
}

async function targetFiles(options) {
  if (options.mode === "all") return allHtmlFiles();
  if (options.mode === "staged") return stagedFiles("*.html");
  if (options.mode === "file") return [options.file];
  if (options.mode === "project") return projectHtmlFiles(options.project);
  throw new Error("Usage: html-audit.mjs --staged | --all | --project <name> | --file <path> [--rules <dir>]");
}

class AuditNode {
  constructor({ tagName = "#document", attrs = [], parentElement = null } = {}) {
    this.tagName = tagName.toLowerCase();
    this.attrs = new Map(attrs.map((attr) => [attr.name, attr.value]));
    this.parentElement = parentElement;
    this.children = [];
    this.id = this.attrs.get("id") ?? "";
  }

  getAttribute(name) {
    return this.attrs.has(name) ? this.attrs.get(name) : null;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  querySelectorAll(selector) {
    return querySelectorAll(this, selector);
  }

  matches(selector) {
    return matchesSelector(this, selector);
  }

  closest(selector) {
    let current = this;
    while (current && current.tagName !== "#document") {
      if (matchesSelector(current, selector)) return current;
      current = current.parentElement;
    }
    return null;
  }
}

function parseHtmlDocument(html) {
  const parser = new HTMLParser();
  const root = new AuditNode();
  const stack = [root];

  parser.addListener("tagstart", (event) => {
    const parent = stack.at(-1);
    const node = new AuditNode({ tagName: event.tagName, attrs: event.attrs, parentElement: parent });
    parent.children.push(node);
    const tagName = event.tagName.toLowerCase();
    if (!event.close && !VOID_TAGS.has(tagName)) stack.push(node);
  });

  parser.addListener("tagend", (event) => {
    const tagName = event.tagName.toLowerCase();
    for (let index = stack.length - 1; index > 0; index -= 1) {
      if (stack[index].tagName === tagName) {
        stack.length = index;
        break;
      }
    }
  });

  parser.parse(html);
  return root;
}

function splitSelector(selector) {
  const parts = [];
  let buffer = "";
  let combinator = " ";
  let quote = null;
  let bracketDepth = 0;
  let parenDepth = 0;

  const push = () => {
    const compound = buffer.trim();
    if (compound) parts.push({ combinator, compound });
    buffer = "";
  };

  for (let index = 0; index < selector.length; index += 1) {
    const char = selector[index];
    if (quote) {
      buffer += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      buffer += char;
      continue;
    }
    if (char === "[") bracketDepth += 1;
    if (char === "]") bracketDepth -= 1;
    if (char === "(") parenDepth += 1;
    if (char === ")") parenDepth -= 1;
    if (bracketDepth === 0 && parenDepth === 0 && char === ">") {
      push();
      combinator = ">";
      continue;
    }
    if (bracketDepth === 0 && parenDepth === 0 && /\s/.test(char)) {
      push();
      combinator = " ";
      while (/\s/.test(selector[index + 1] ?? "")) index += 1;
      continue;
    }
    buffer += char;
  }
  push();
  return parts;
}

function querySelectorAll(root, selector) {
  const results = [];
  const visit = (node) => {
    for (const child of node.children) {
      if (matchesSelector(child, selector)) results.push(child);
      visit(child);
    }
  };
  visit(root);
  return results;
}

function matchesSelector(node, selector) {
  const parts = splitSelector(selector);
  if (parts.length === 0) throw new Error(`empty selector "${selector}"`);
  return matchesSelectorPart(node, parts, parts.length - 1);
}

function matchesSelectorPart(node, parts, index) {
  if (!node || node.tagName === "#document") return false;
  if (!matchesCompound(node, parts[index].compound)) return false;
  if (index === 0) return true;

  const relation = parts[index].combinator;
  if (relation === ">") return matchesSelectorPart(node.parentElement, parts, index - 1);

  let ancestor = node.parentElement;
  while (ancestor && ancestor.tagName !== "#document") {
    if (matchesSelectorPart(ancestor, parts, index - 1)) return true;
    ancestor = ancestor.parentElement;
  }
  return false;
}

function matchesCompound(node, compound) {
  let rest = compound;
  const tagMatch = rest.match(/^([a-zA-Z][\w-]*|\*)/);
  if (tagMatch) {
    const tagName = tagMatch[1].toLowerCase();
    if (tagName !== "*" && node.tagName !== tagName) return false;
    rest = rest.slice(tagMatch[0].length);
  }

  while (rest.length > 0) {
    if (rest.startsWith(".")) {
      const match = rest.match(/^\.([\w-]+)/);
      if (!match) throw new Error(`unsupported selector part "${rest}" in "${compound}"`);
      const classes = (node.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);
      if (!classes.includes(match[1])) return false;
      rest = rest.slice(match[0].length);
    } else if (rest.startsWith("#")) {
      const match = rest.match(/^#([\w-]+)/);
      if (!match) throw new Error(`unsupported selector part "${rest}" in "${compound}"`);
      if (node.id !== match[1]) return false;
      rest = rest.slice(match[0].length);
    } else if (rest.startsWith("[")) {
      const end = rest.indexOf("]");
      if (end === -1) throw new Error(`unterminated attribute selector in "${compound}"`);
      const source = rest.slice(1, end);
      const match = source.match(/^([\w-:]+)(\^?=)?(?:"([^"]*)"|'([^']*)'|(.+))?$/);
      if (!match) throw new Error(`unsupported attribute selector "[${source}]"`);
      const [, name, operator, doubleQuoted, singleQuoted, bareValue] = match;
      const expected = doubleQuoted ?? singleQuoted ?? bareValue ?? "";
      const actual = node.getAttribute(name);
      if (operator === undefined) {
        if (actual === null) return false;
      } else if (operator === "=") {
        if (actual !== expected) return false;
      } else if (operator === "^=") {
        if (actual === null || !actual.startsWith(expected)) return false;
      } else {
        throw new Error(`unsupported attribute operator "${operator}"`);
      }
      rest = rest.slice(end + 1);
    } else if (rest.startsWith(":not(")) {
      const end = rest.indexOf(")");
      if (end === -1) throw new Error(`unterminated :not() in "${compound}"`);
      const inner = rest.slice(5, end).trim();
      if (matchesCompound(node, inner)) return false;
      rest = rest.slice(end + 1);
    } else {
      throw new Error(`unsupported selector part "${rest}" in "${compound}"`);
    }
  }
  return true;
}

function evaluateHtmlAudit({ html, file, rule }) {
  const doc = parseHtmlDocument(html);
  const failures = [];

  const fail = (check, message) => failures.push({ file, rule: rule.__rulePath, check, message });
  const messageFor = (item, fallback) => (typeof item === "string" ? fallback : (item.message ?? fallback));
  const count = (selector, check) => {
    try {
      return doc.querySelectorAll(selector).length;
    } catch (error) {
      fail(check, `invalid selector "${selector}": ${error.message}`);
      return null;
    }
  };
  const queryAll = (selector, check) => {
    try {
      return [...doc.querySelectorAll(selector)];
    } catch (error) {
      fail(check, `invalid selector "${selector}": ${error.message}`);
      return null;
    }
  };

  for (const item of rule.forbiddenSelectors ?? []) {
    const selector = typeof item === "string" ? item : item.selector;
    const found = count(selector, "forbiddenSelectors");
    if (found && found > 0) {
      fail("forbiddenSelectors", messageFor(item, `${selector} found ${found} time(s)`));
    }
  }

  for (const item of rule.requiredSelectors ?? []) {
    const selector = typeof item === "string" ? item : item.selector;
    const min = typeof item === "string" ? 1 : (item.min ?? 1);
    const found = count(selector, "requiredSelectors");
    if (found !== null && found < min) {
      fail("requiredSelectors", messageFor(item, `${selector} found ${found}, expected >= ${min}`));
    }
  }

  for (const item of rule.selectorCounts ?? []) {
    const found = count(item.selector, "selectorCounts");
    if (found === null) continue;
    if (item.equals !== undefined && found !== item.equals) {
      fail("selectorCounts", `${item.selector} found ${found}, expected ${item.equals}`);
    }
    if (item.min !== undefined && found < item.min) {
      fail("selectorCounts", `${item.selector} found ${found}, expected >= ${item.min}`);
    }
    if (item.max !== undefined && found > item.max) {
      fail("selectorCounts", `${item.selector} found ${found}, expected <= ${item.max}`);
    }
  }

  for (const item of rule.countEquals ?? []) {
    const values = item.selectors.map((selector) => ({ selector, count: count(selector, "countEquals") }));
    if (values.some((value) => value.count === null)) continue;
    const expected = values[0].count;
    const mismatches = values.filter((value) => value.count !== expected);
    if (mismatches.length > 0) {
      fail(
        "countEquals",
        `${item.name ?? item.selectors.join(" = ")} mismatch: ${values
          .map((value) => `${value.selector}:${value.count}`)
          .join(", ")}`,
      );
    }
  }

  for (const item of rule.forbiddenDescendants ?? []) {
    const ancestors = queryAll(item.ancestor, "forbiddenDescendants");
    if (!ancestors) continue;
    const offenders = ancestors.filter((ancestor) => ancestor.querySelector(item.descendant));
    if (offenders.length > 0) {
      fail(
        "forbiddenDescendants",
        item.message ?? `${item.ancestor} contains ${item.descendant} ${offenders.length} time(s)`,
      );
    }
  }

  for (const item of rule.requiredAncestor ?? []) {
    const nodes = queryAll(item.selector, "requiredAncestor");
    if (!nodes) continue;
    const offenders = nodes.filter((node) => !node.closest(item.ancestor));
    if (offenders.length > 0) {
      fail(
        "requiredAncestor",
        item.message ?? `${item.selector} missing ancestor ${item.ancestor} ${offenders.length} time(s)`,
      );
    }
  }

  for (const item of rule.requiredDirectParent ?? []) {
    const nodes = queryAll(item.selector, "requiredDirectParent");
    if (!nodes) continue;
    const offenders = nodes.filter((node) => !node.parentElement?.matches(item.parent));
    if (offenders.length > 0) {
      fail(
        "requiredDirectParent",
        item.message ?? `${item.selector} missing direct parent ${item.parent} ${offenders.length} time(s)`,
      );
    }
  }

  for (const item of rule.forbiddenText ?? []) {
    const pattern = typeof item === "string" ? item : item.pattern;
    const flags = typeof item === "string" ? "" : (item.flags ?? "");
    const hits =
      typeof item === "string"
        ? html.includes(pattern)
          ? 1
          : 0
        : [...html.matchAll(new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`))].length;
    if (hits > 0) fail("forbiddenText", messageFor(item, `${pattern} found ${hits} time(s)`));
  }

  for (const item of rule.requiredText ?? []) {
    const pattern = typeof item === "string" ? item : item.pattern;
    const flags = typeof item === "string" ? "" : (item.flags ?? "");
    const hits =
      typeof item === "string"
        ? html.includes(pattern)
          ? 1
          : 0
        : [...html.matchAll(new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`))].length;
    if (hits === 0) fail("requiredText", messageFor(item, `${pattern} not found`));
  }

  if (rule.tocSections) {
    const tocSelector = rule.tocSections.tocSelector ?? '.toc a[href^="#"]';
    const sectionSelector = rule.tocSections.sectionSelector ?? "section[id]";
    const ignore = new Set(rule.tocSections.ignoreSectionIds ?? []);
    const tocIds = [...doc.querySelectorAll(tocSelector)]
      .map((anchor) => anchor.getAttribute("href") ?? "")
      .filter((href) => href.startsWith("#"))
      .map((href) => decodeURIComponent(href.slice(1)));
    const sectionIds = [...doc.querySelectorAll(sectionSelector)].map((section) => section.id).filter(Boolean);
    const missingToc = sectionIds.filter((id) => !ignore.has(id) && !tocIds.includes(id));
    const danglingToc = tocIds.filter((id) => !sectionIds.includes(id));
    const missingRequired = (rule.tocSections.requiredAnchors ?? []).filter((id) => !tocIds.includes(id));
    if (missingToc.length > 0) fail("tocSections", `section(s) missing from TOC: ${missingToc.join(", ")}`);
    if (danglingToc.length > 0) fail("tocSections", `TOC anchor(s) without section: ${danglingToc.join(", ")}`);
    if (missingRequired.length > 0)
      fail("tocSections", `required TOC anchor(s) missing: ${missingRequired.join(", ")}`);
  }

  return failures;
}

export async function auditFiles({ files, rulesDir = DEFAULT_RULES_DIR }) {
  const rules = await loadRules(rulesDir);
  const failures = [];
  let audited = 0;
  for (const file of files) {
    const fileRules = matchingRules(file, rules);
    if (fileRules.length === 0) continue;
    const abs = path.isAbsolute(file) ? file : path.join(REPO_ROOT, file);
    const html = await readFile(abs, "utf8");
    for (const rule of fileRules) {
      audited += 1;
      const result = evaluateHtmlAudit({ html, file: normalizeFileForCompare(file), rule });
      failures.push(...result);
    }
  }
  return { audited, failures };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const files = await targetFiles(options);
  if (files.length === 0) {
    console.log("[html-audit] no HTML files in scope. Skipping.");
    return;
  }
  const { audited, failures } = await auditFiles({ files, rulesDir: options.rulesDir });
  if (audited === 0) {
    console.log("[html-audit] no matching audit rules for HTML files in scope. Skipping.");
    return;
  }
  if (failures.length > 0) {
    console.error(`[html-audit] ${failures.length} failure(s) across ${audited} audited file/rule pair(s):`);
    for (const failure of failures) {
      console.error(`  - ${failure.file} [${failure.check}] ${failure.message}`);
    }
    process.exit(1);
  }
  console.log(`[html-audit] OK. audited=${audited}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}
