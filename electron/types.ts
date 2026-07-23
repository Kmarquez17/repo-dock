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
}

export type GitRemoteInfo =
  | { protocol: "https"; host: string; url: string }
  | { protocol: "ssh"; host: string }
  | { protocol: "other"; url: string }
  | { error: string };

export type TokenUpdateResult = { ok: true } | { ok: false; error: string };
