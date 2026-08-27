import { contextBridge, ipcRenderer } from "electron";
import type {
  RootFolder,
  RepoInfo,
  InstalledIdes,
  GitRemoteInfo,
  TokenUpdateResult,
  RemoteUrlResult,
  RepoGitStatus,
  UpdateStatus,
} from "./types";

const api = {
  getRootFolders: (): Promise<RootFolder[]> => ipcRenderer.invoke("config:get-root-folders"),
  pickFolder: (): Promise<{ path: string; suggestedName: string } | null> =>
    ipcRenderer.invoke("config:pick-folder"),
  addRootFolder: (folderPath: string, name: string): Promise<RootFolder[]> =>
    ipcRenderer.invoke("config:add-root-folder", folderPath, name),
  updateRootFolder: (id: string, name: string): Promise<RootFolder[]> =>
    ipcRenderer.invoke("config:update-root-folder", id, name),
  removeRootFolder: (id: string): Promise<RootFolder[]> => ipcRenderer.invoke("config:remove-root-folder", id),
  scanRepos: (): Promise<RepoInfo[]> => ipcRenderer.invoke("repos:scan"),
  detectIdes: (): Promise<InstalledIdes> => ipcRenderer.invoke("ides:detect"),
  openInIde: (idePath: string, repoPath: string): Promise<boolean> =>
    ipcRenderer.invoke("ides:open", idePath, repoPath),
  openInExplorer: (repoPath: string): Promise<boolean> => ipcRenderer.invoke("shell:open-path", repoPath),
  openTerminal: (repoPath: string): Promise<boolean> => ipcRenderer.invoke("terminal:open", repoPath),
  getRemoteInfo: (repoPath: string): Promise<GitRemoteInfo> => ipcRenderer.invoke("git:get-remote-info", repoPath),
  updateRemoteToken: (repoPath: string, token: string): Promise<TokenUpdateResult> =>
    ipcRenderer.invoke("git:update-remote-token", repoPath, token),
  openRemoteInBrowser: (repoPath: string): Promise<TokenUpdateResult> =>
    ipcRenderer.invoke("git:open-remote", repoPath),
  getRemoteUrl: (repoPath: string): Promise<RemoteUrlResult> => ipcRenderer.invoke("git:get-remote-url", repoPath),
  getRepoStatus: (repoPath: string): Promise<RepoGitStatus | null> => ipcRenderer.invoke("git:get-status", repoPath),
  getFavorites: (): Promise<string[]> => ipcRenderer.invoke("config:get-favorites"),
  toggleFavorite: (repoPath: string): Promise<string[]> => ipcRenderer.invoke("config:toggle-favorite", repoPath),
  copyToClipboard: (text: string): Promise<void> => ipcRenderer.invoke("shell:copy-text", text),
  hideWindow: (): Promise<void> => ipcRenderer.invoke("window:hide"),
  getShortcut: (): Promise<string | null> => ipcRenderer.invoke("shortcut:get"),
  setShortcut: (accelerator: string): Promise<TokenUpdateResult> => ipcRenderer.invoke("shortcut:set", accelerator),
  getAutostart: (): Promise<boolean> => ipcRenderer.invoke("app:get-autostart"),
  setAutostart: (enabled: boolean): Promise<boolean> => ipcRenderer.invoke("app:set-autostart", enabled),
  getAppVersion: (): Promise<string> => ipcRenderer.invoke("app:get-version"),
  getUpdateStatus: (): Promise<UpdateStatus> => ipcRenderer.invoke("update:get-status"),
  checkForUpdates: (): Promise<void> => ipcRenderer.invoke("update:check"),
  installUpdate: (): Promise<void> => ipcRenderer.invoke("update:install"),
  onUpdateStatus: (callback: (status: UpdateStatus) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, status: UpdateStatus) => callback(status);
    ipcRenderer.on("update:status", listener);
    return () => ipcRenderer.removeListener("update:status", listener);
  },
};

contextBridge.exposeInMainWorld("api", api);

export type RepoLauncherApi = typeof api;
