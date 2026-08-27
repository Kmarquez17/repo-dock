import { execFile } from "child_process";
import { promisify } from "util";
import { shell } from "electron";
import type { GitRemoteInfo, RemoteUrlResult, TokenUpdateResult } from "./types";

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

function sshToHttps(url: string): string | null {
  const scp = url.match(/^git@([^:]+):(.+)$/);
  const match = scp ?? url.match(/^ssh:\/\/(?:[^@/]+@)?([^/]+)\/(.+)$/);
  if (!match) return null;
  return `https://${match[1]}/${match[2].replace(/\.git$/, "")}`;
}

function toBrowserUrl(url: string): string | null {
  const https = parseHttps(url);
  if (https) return `https://${https.host}/${https.repoPath.replace(/\.git$/, "")}`;
  return sshToHttps(url);
}

export async function getRemoteBrowserUrl(repoPath: string): Promise<RemoteUrlResult> {
  let url: string;
  try {
    url = await getOriginUrl(repoPath);
  } catch {
    return { ok: false, error: "No se encontró un remote 'origin' en este repositorio." };
  }

  const browserUrl = toBrowserUrl(url);
  if (!browserUrl) {
    return { ok: false, error: "No se pudo interpretar la URL del remote." };
  }

  return { ok: true, url: browserUrl };
}

export async function openRemoteInBrowser(repoPath: string): Promise<TokenUpdateResult> {
  const result = await getRemoteBrowserUrl(repoPath);
  if (!result.ok) return result;

  await shell.openExternal(result.url);
  return { ok: true };
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
