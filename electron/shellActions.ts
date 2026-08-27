import { shell } from "electron";
import { spawn, spawnSync } from "child_process";

export async function openInExplorer(repoPath: string): Promise<boolean> {
  const error = await shell.openPath(repoPath);
  return error === "";
}

let cachedShellExe: string | null = null;

function resolvePowerShellExe(): string {
  if (cachedShellExe) return cachedShellExe;
  // Prefer PowerShell 7 (pwsh.exe) over the legacy Windows PowerShell 5.1
  // (powershell.exe). This only picks which binary gets launched — it never
  // touches $PROFILE or any PowerShell configuration.
  const probe = spawnSync("where", ["pwsh.exe"], { windowsHide: true });
  cachedShellExe = probe.status === 0 ? "pwsh.exe" : "powershell.exe";
  return cachedShellExe;
}

export function openTerminal(repoPath: string): boolean {
  // "cmd /c start" forces a brand-new console window; spawning the shell
  // directly can silently fail to show a window when the Electron process
  // itself has no attached console (e.g. packaged app, or run via a task runner).
  const shellExe = resolvePowerShellExe();
  const child = spawn("cmd.exe", ["/c", "start", "", shellExe, "-NoExit"], {
    cwd: repoPath,
    detached: true,
    stdio: "ignore",
    windowsHide: false,
  });
  child.unref();
  return true;
}
