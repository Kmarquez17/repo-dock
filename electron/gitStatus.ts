import { execFile } from "child_process";
import { promisify } from "util";
import type { RepoGitStatus } from "./types";

const execFileAsync = promisify(execFile);

export async function getRepoGitStatus(repoPath: string): Promise<RepoGitStatus | null> {
  try {
    const [branchResult, statusResult] = await Promise.all([
      execFileAsync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: repoPath }),
      execFileAsync("git", ["status", "--porcelain"], { cwd: repoPath }),
    ]);
    const branch = branchResult.stdout.trim() || null;
    const dirty = statusResult.stdout.trim().length > 0;
    return { branch, dirty };
  } catch {
    return null;
  }
}
