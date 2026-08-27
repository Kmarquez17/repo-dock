export type ProjectType =
  | "react"
  | "vue"
  | "angular"
  | "electron"
  | "node"
  | "dotnet"
  | "python"
  | "go"
  | "rust"
  | "java"
  | "php"
  | "git"
  | "unknown";

export interface RepoInfo {
  name: string;
  path: string;
  rootFolder: string;
  type: ProjectType;
  lastModified: number;
}

export interface InstalledIdes {
  vscode: string | null;
  cursor: string | null;
}

export interface RootFolder {
  id: string;
  name: string;
  path: string;
}

export interface AppConfig {
  rootFolders: RootFolder[];
  maxScanDepth: number;
  shortcut: string;
  favorites: string[];
}

export type GitRemoteInfo =
  | { protocol: "https"; host: string; url: string }
  | { protocol: "ssh"; host: string }
  | { protocol: "other"; url: string }
  | { error: string };

export type TokenUpdateResult = { ok: true } | { ok: false; error: string };

export type RemoteUrlResult = { ok: true; url: string } | { ok: false; error: string };

export interface RepoGitStatus {
  branch: string | null;
  dirty: boolean;
}

export type UpdateStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available"; version: string }
  | { state: "not-available" }
  | { state: "downloading"; percent: number }
  | { state: "downloaded"; version: string }
  | { state: "error"; message: string };
