import * as fs from "fs";
import * as path from "path";
import type { RepoInfo } from "./types";
import { detectProjectType } from "./projectType";

const IGNORED_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "dist-electron",
  "build",
  "out",
  "bin",
  "obj",
  ".vscode",
  ".idea",
  "__pycache__",
  ".venv",
  "venv",
]);

function isRepo(dir: string): boolean {
  return fs.existsSync(path.join(dir, ".git"));
}

function scanDir(dir: string, rootFolder: string, depth: number, maxDepth: number, results: RepoInfo[]): void {
  if (depth > maxDepth) return;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  if (isRepo(dir)) {
    let lastModified = 0;
    try {
      lastModified = fs.statSync(dir).mtimeMs;
    } catch {
      /* ignore */
    }
    results.push({
      name: path.basename(dir),
      path: dir,
      rootFolder,
      type: detectProjectType(dir),
      lastModified,
    });
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (IGNORED_DIR_NAMES.has(entry.name)) continue;
    if (entry.name.startsWith(".")) continue;
    scanDir(path.join(dir, entry.name), rootFolder, depth + 1, maxDepth, results);
  }
}

export function scanRepos(rootFolders: string[], maxDepth: number): RepoInfo[] {
  const results: RepoInfo[] = [];
  for (const root of rootFolders) {
    if (!fs.existsSync(root)) continue;
    scanDir(root, root, 0, maxDepth, results);
  }
  results.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
  return results;
}
