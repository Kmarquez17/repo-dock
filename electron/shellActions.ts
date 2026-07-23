import { shell } from "electron";
import { spawn } from "child_process";

export async function openInExplorer(repoPath: string): Promise<boolean> {
  const error = await shell.openPath(repoPath);
  return error === "";
}

export function openTerminal(repoPath: string): boolean {
  // "cmd /c start" forces a brand-new console window; spawning powershell.exe
  // directly can silently fail to show a window when the Electron process
  // itself has no attached console (e.g. packaged app, or run via a task runner).
  const child = spawn("cmd.exe", ["/c", "start", "", "powershell.exe", "-NoExit"], {
    cwd: repoPath,
    detached: true,
    stdio: "ignore",
    windowsHide: false,
  });
  child.unref();
  return true;
}
