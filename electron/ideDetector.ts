import { exec, spawn } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import type { InstalledIdes } from "./types";

const execAsync = promisify(exec);

async function findOnPath(command: string): Promise<string | null> {
  try {
    const finder = process.platform === "win32" ? "where" : "which";
    const { stdout } = await execAsync(`${finder} ${command}`);
    const lines = stdout
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    return lines[0] ?? null;
  } catch {
    return null;
  }
}

function findKnownInstallPath(candidates: string[]): string | null {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function vscodeCandidates(): string[] {
  const localAppData = process.env.LOCALAPPDATA ?? "";
  const programFiles = process.env["ProgramFiles"] ?? "";
  const programFilesX86 = process.env["ProgramFiles(x86)"] ?? "";
  return [
    path.join(localAppData, "Programs", "Microsoft VS Code", "Code.exe"),
    path.join(programFiles, "Microsoft VS Code", "Code.exe"),
    path.join(programFilesX86, "Microsoft VS Code", "Code.exe"),
  ];
}

function cursorCandidates(): string[] {
  const localAppData = process.env.LOCALAPPDATA ?? "";
  const programFiles = process.env["ProgramFiles"] ?? "";
  return [
    path.join(localAppData, "Programs", "cursor", "Cursor.exe"),
    path.join(localAppData, "Programs", "Cursor", "Cursor.exe"),
    path.join(programFiles, "cursor", "Cursor.exe"),
  ];
}

async function detectOne(knownCandidates: string[], pathCommands: string[]): Promise<string | null> {
  const known = findKnownInstallPath(knownCandidates);
  if (known) return known;

  for (const command of pathCommands) {
    const found = await findOnPath(command);
    if (found) return found;
  }
  return null;
}

export async function detectInstalledIdes(): Promise<InstalledIdes> {
  const [vscode, cursor] = await Promise.all([
    detectOne(vscodeCandidates(), ["code.cmd", "code"]),
    detectOne(cursorCandidates(), ["cursor.cmd", "cursor"]),
  ]);
  return { vscode, cursor };
}

export function openInIde(idePath: string, repoPath: string): void {
  const child = spawn(idePath, [repoPath], {
    detached: true,
    stdio: "ignore",
    shell: idePath.toLowerCase().endsWith(".cmd"),
  });
  child.unref();
}
