import * as fs from "fs";
import * as path from "path";
import type { ProjectType } from "./types";

function exists(dir: string, file: string): boolean {
  return fs.existsSync(path.join(dir, file));
}

function findByExtension(dir: string, ext: string): boolean {
  try {
    return fs.readdirSync(dir).some((f) => f.toLowerCase().endsWith(ext));
  } catch {
    return false;
  }
}

function readPackageJson(dir: string): Record<string, unknown> | null {
  try {
    const raw = fs.readFileSync(path.join(dir, "package.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function detectProjectType(repoPath: string): ProjectType {
  const pkg = readPackageJson(repoPath);
  if (pkg) {
    const deps = {
      ...(pkg.dependencies as Record<string, string> | undefined),
      ...(pkg.devDependencies as Record<string, string> | undefined),
    };
    if (deps.electron) return "electron";
    if (deps["next"] || deps.react) return "react";
    if (deps.vue || deps.nuxt) return "vue";
    if (deps["@angular/core"]) return "angular";
    return "node";
  }

  if (
    exists(repoPath, "requirements.txt") ||
    exists(repoPath, "pyproject.toml") ||
    exists(repoPath, "manage.py") ||
    exists(repoPath, "Pipfile")
  ) {
    return "python";
  }

  if (findByExtension(repoPath, ".sln") || findByExtension(repoPath, ".csproj")) {
    return "dotnet";
  }

  if (exists(repoPath, "go.mod")) return "go";
  if (exists(repoPath, "Cargo.toml")) return "rust";
  if (exists(repoPath, "pom.xml") || exists(repoPath, "build.gradle") || exists(repoPath, "build.gradle.kts")) {
    return "java";
  }
  if (exists(repoPath, "composer.json")) return "php";
  if (exists(repoPath, ".git")) return "git";

  return "unknown";
}
