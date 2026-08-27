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

export interface RepoLauncherApi {
  getRootFolders: () => Promise<RootFolder[]>;
  pickFolder: () => Promise<{ path: string; suggestedName: string } | null>;
  addRootFolder: (folderPath: string, name: string) => Promise<RootFolder[]>;
  updateRootFolder: (id: string, name: string) => Promise<RootFolder[]>;
  removeRootFolder: (id: string) => Promise<RootFolder[]>;
  scanRepos: () => Promise<RepoInfo[]>;
  detectIdes: () => Promise<InstalledIdes>;
  openInIde: (idePath: string, repoPath: string) => Promise<boolean>;
  openInExplorer: (repoPath: string) => Promise<boolean>;
  openTerminal: (repoPath: string) => Promise<boolean>;
  getRemoteInfo: (repoPath: string) => Promise<GitRemoteInfo>;
  updateRemoteToken: (repoPath: string, token: string) => Promise<TokenUpdateResult>;
  openRemoteInBrowser: (repoPath: string) => Promise<TokenUpdateResult>;
  getRemoteUrl: (repoPath: string) => Promise<RemoteUrlResult>;
  getRepoStatus: (repoPath: string) => Promise<RepoGitStatus | null>;
  getFavorites: () => Promise<string[]>;
  toggleFavorite: (repoPath: string) => Promise<string[]>;
  copyToClipboard: (text: string) => Promise<void>;
  hideWindow: () => Promise<void>;
  getShortcut: () => Promise<string | null>;
  setShortcut: (accelerator: string) => Promise<TokenUpdateResult>;
  getAutostart: () => Promise<boolean>;
  setAutostart: (enabled: boolean) => Promise<boolean>;
}
