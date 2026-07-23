import { execFile } from "child_process";
import { promisify } from "util";
import type { GitRemoteInfo, TokenUpdateResult } from "./types";

const execFileAsync = promisify(execFile);

async function getOriginUrl(repoPath: string): Promise<string> {
  const { stdout } = await execFileAsync("git", ["remote", "get-url", "origin"], { cwd: repoPath });
  return stdout.trim();
}

function parseHttps(url: string): { host: string; repoPath: string } | null {
  const match = url.match(/^https?:\/\/(?:[^@/]+@)?([^/]+)\/(.+)$/);
  if (!match) return null;
  return { host: match[1], repoPath: match[2] };
}

function isSsh(url: string): string | null {
  const scp = url.match(/^git@([^:]+):/);
  if (scp) return scp[1];
  const sshUrl = url.match(/^ssh:\/\/(?:[^@/]+@)?([^/]+)\//);
  if (sshUrl) return sshUrl[1];
  return null;
}

export async function getRemoteInfo(repoPath: string): Promise<GitRemoteInfo> {
  let url: string;
  try {
    url = await getOriginUrl(repoPath);
  } catch {
    return { error: "No se encontró un remote 'origin' en este repositorio." };
  }

  const sshHost = isSsh(url);
  if (sshHost) return { protocol: "ssh", host: sshHost };

  const https = parseHttps(url);
  if (https) return { protocol: "https", host: https.host, url: `https://${https.host}/${https.repoPath}` };

  return { protocol: "other", url };
}

export async function updateRemoteToken(repoPath: string, token: string): Promise<TokenUpdateResult> {
  let url: string;
  try {
    url = await getOriginUrl(repoPath);
  } catch {
    return { ok: false, error: "No se encontró un remote 'origin' en este repositorio." };
  }

  if (isSsh(url)) {
    return { ok: false, error: "Este repositorio usa SSH; la actualización de token no aplica." };
  }

  const https = parseHttps(url);
  if (!https) {
    return { ok: false, error: "No se pudo interpretar la URL del remote." };
  }

  const newUrl = `https://${token}@${https.host}/${https.repoPath}`;
  try {
    await execFileAsync("git", ["remote", "set-url", "origin", newUrl], { cwd: repoPath });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido al actualizar el remote." };
  }
}
