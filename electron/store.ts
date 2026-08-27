import Store from "electron-store";
import * as path from "path";
import * as crypto from "crypto";
import type { AppConfig, RootFolder } from "./types";

const defaults: AppConfig = {
  rootFolders: [],
  maxScanDepth: 3,
  shortcut: "",
  favorites: [],
};

export const configStore = new Store<AppConfig>({
  name: "config",
  defaults,
});

function migrateRootFolders(): void {
  const raw = configStore.get("rootFolders") as unknown;
  if (!Array.isArray(raw) || raw.length === 0 || typeof raw[0] !== "string") return;

  const migrated: RootFolder[] = (raw as string[]).map((folderPath) => ({
    id: crypto.randomUUID(),
    name: path.basename(folderPath) || folderPath,
    path: folderPath,
  }));
  configStore.set("rootFolders", migrated);
}

migrateRootFolders();

export function getRootFolders(): RootFolder[] {
  return configStore.get("rootFolders");
}

export function addRootFolder(folderPath: string, name: string): RootFolder[] {
  const current = configStore.get("rootFolders");
  if (!current.some((f) => f.path === folderPath)) {
    const next: RootFolder = { id: crypto.randomUUID(), name, path: folderPath };
    configStore.set("rootFolders", [...current, next]);
  }
  return configStore.get("rootFolders");
}

export function updateRootFolder(id: string, name: string): RootFolder[] {
  const current = configStore.get("rootFolders");
  configStore.set(
    "rootFolders",
    current.map((f) => (f.id === id ? { ...f, name } : f))
  );
  return configStore.get("rootFolders");
}

export function removeRootFolder(id: string): RootFolder[] {
  const current = configStore.get("rootFolders");
  configStore.set(
    "rootFolders",
    current.filter((f) => f.id !== id)
  );
  return configStore.get("rootFolders");
}

export function getShortcut(): string {
  return configStore.get("shortcut");
}

export function setShortcut(accelerator: string): void {
  configStore.set("shortcut", accelerator);
}

export function getFavorites(): string[] {
  return configStore.get("favorites");
}

export function toggleFavorite(repoPath: string): string[] {
  const current = configStore.get("favorites");
  const next = current.includes(repoPath) ? current.filter((p) => p !== repoPath) : [...current, repoPath];
  configStore.set("favorites", next);
  return next;
}
