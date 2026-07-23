import { contextBridge, ipcRenderer } from "electron";
import type { RootFolder, RepoInfo, InstalledIdes, GitRemoteInfo, TokenUpdateResult } from "./types";

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
  hideWindow: (): Promise<void> => ipcRenderer.invoke("window:hide"),
};

contextBridge.exposeInMainWorld("api", api);

export type RepoLauncherApi = typeof api;
