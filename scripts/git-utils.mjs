import { execFileSync } from "node:child_process";

export function git(args, options = {}) {
  return execFileSync("git", args, { encoding: "utf8", ...options });
}

export function stagedFiles(pathspec) {
  const args = ["-c", "core.quotePath=false", "diff", "--cached", "--name-only", "--diff-filter=ACM"];
  if (pathspec) args.push("--", pathspec);
  return git(args).split("\n").filter(Boolean);
}

export function gitAdd(file) {
  execFileSync("git", ["add", "--", file], { stdio: "inherit" });
}
