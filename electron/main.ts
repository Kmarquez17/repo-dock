import { app, BrowserWindow, Tray, Menu, ipcMain, dialog, nativeImage, screen, globalShortcut, clipboard } from "electron";
import * as path from "path";
import {
  getRootFolders,
  addRootFolder,
  updateRootFolder,
  removeRootFolder,
  configStore,
  getShortcut,
  setShortcut,
  getFavorites,
  toggleFavorite,
} from "./store";
import { scanRepos } from "./repoScanner";
import { detectInstalledIdes, openInIde } from "./ideDetector";
import { openInExplorer, openTerminal } from "./shellActions";
import { getRemoteInfo, updateRemoteToken, openRemoteInBrowser, getRemoteBrowserUrl } from "./gitRemote";
import { getRepoGitStatus } from "./gitStatus";
import { autoUpdater } from "electron-updater";
import type { TokenUpdateResult } from "./types";

const isDev = !app.isPackaged;
const VITE_DEV_SERVER_URL = "http://localhost:5173";

// Tried in order until one registers successfully. Ctrl+F12 first (requested
// default); the rest are unlikely to collide with IDEs/browsers/OS shortcuts.
const SHORTCUT_FALLBACKS = [
  "CommandOrControl+F12",
  "CommandOrControl+Alt+R",
  "CommandOrControl+Shift+Space",
  "CommandOrControl+Alt+F12",
];

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isDialogOpen = false;
let lastAutoHideAt = 0;
let activeShortcut: string | null = null;

function getWindowPosition(): { x: number; y: number } {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  const windowWidth = 380;
  const windowHeight = 640;
  return {
    x: display.workArea.x + width - windowWidth - 16,
    y: display.workArea.y + height - windowHeight - 16,
  };
}

function createWindow(): BrowserWindow {
  const { x, y } = getWindowPosition();

  const win = new BrowserWindow({
    width: 380,
    height: 640,
    x,
    y,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    icon: path.join(__dirname, "assets", "icon-256.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  win.on("closed", () => {
    mainWindow = null;
  });

  win.on("blur", () => {
    // Ignore blur while a native dialog (e.g. "choose folder") is open on top
    // of the window — otherwise the window would hide itself with the dialog
    // still visible.
    if (isDialogOpen) return;
    lastAutoHideAt = Date.now();
    win.hide();
  });

  win.setAlwaysOnTop(true, "screen-saver");

  win.once("ready-to-show", () => win.show());

  mainWindow = win;
  return win;
}

function toggleWindow(): void {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isVisible()) {
    mainWindow.hide();
    return;
  }

  // Clicking the tray icon while the window is open blurs it first (hiding it
  // via the "blur" handler above), then delivers this same click as a tray
  // "click" event. Without this guard the window would immediately reappear,
  // making it impossible to close by clicking the tray icon.
  const justAutoHidden = Date.now() - lastAutoHideAt < 250;
  if (justAutoHidden) return;

  const { x, y } = getWindowPosition();
  mainWindow.setPosition(x, y);
  mainWindow.show();
  mainWindow.focus();
}

function createTray(): void {
  const icon = nativeImage.createFromPath(path.join(__dirname, "assets", "icon-32.png"));
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip("RepoDock");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Mostrar / ocultar", click: () => toggleWindow() },
      { type: "separator" },
      { label: "Salir", click: () => app.quit() },
    ])
  );
  tray.on("click", () => toggleWindow());
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  // Another instance is already running (e.g. launched via autostart); don't
  // spin up a second process, just let this one exit.
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) {
      createWindow();
      return;
    }
    const { x, y } = getWindowPosition();
    mainWindow.setPosition(x, y);
    mainWindow.show();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    createWindow();
    createTray();
    setupGlobalShortcut();
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });
}

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

function registerFirstAvailableShortcut(preferred?: string): string | null {
  const candidates = preferred ? [preferred, ...SHORTCUT_FALLBACKS] : SHORTCUT_FALLBACKS;
  for (const accelerator of candidates) {
    if (globalShortcut.register(accelerator, () => toggleWindow())) {
      return accelerator;
    }
  }
  return null;
}

function setupGlobalShortcut(): void {
  const saved = getShortcut();
  const registered = registerFirstAvailableShortcut(saved || undefined);
  activeShortcut = registered;
  if (registered && registered !== saved) {
    setShortcut(registered);
  }
}

app.on("window-all-closed", () => {
  // Keep the app alive in the tray; only quit explicitly via the tray menu.
});

// ---- IPC handlers ----

ipcMain.handle("config:get-root-folders", () => getRootFolders());

ipcMain.handle("config:pick-folder", async () => {
  isDialogOpen = true;
  try {
    const result = mainWindow
      ? await dialog.showOpenDialog(mainWindow, { properties: ["openDirectory"] })
      : await dialog.showOpenDialog({ properties: ["openDirectory"] });
    if (result.canceled || result.filePaths.length === 0) return null;
    const folderPath = result.filePaths[0];
    return { path: folderPath, suggestedName: path.basename(folderPath) };
  } finally {
    isDialogOpen = false;
  }
});

ipcMain.handle("config:add-root-folder", (_event, folderPath: string, name: string) =>
  addRootFolder(folderPath, name)
);

ipcMain.handle("config:update-root-folder", (_event, id: string, name: string) => updateRootFolder(id, name));

ipcMain.handle("config:remove-root-folder", (_event, id: string) => removeRootFolder(id));

ipcMain.handle("repos:scan", () => {
  const rootFolders = getRootFolders();
  const maxDepth = configStore.get("maxScanDepth");
  return scanRepos(
    rootFolders.map((f) => f.path),
    maxDepth
  );
});

ipcMain.handle("ides:detect", () => detectInstalledIdes());

ipcMain.handle("ides:open", (_event, idePath: string, repoPath: string) => {
  openInIde(idePath, repoPath);
  return true;
});

ipcMain.handle("shell:open-path", (_event, repoPath: string) => openInExplorer(repoPath));

ipcMain.handle("terminal:open", (_event, repoPath: string) => openTerminal(repoPath));

ipcMain.handle("git:get-remote-info", (_event, repoPath: string) => getRemoteInfo(repoPath));

ipcMain.handle("git:update-remote-token", (_event, repoPath: string, token: string) =>
  updateRemoteToken(repoPath, token)
);

ipcMain.handle("git:open-remote", (_event, repoPath: string) => openRemoteInBrowser(repoPath));

ipcMain.handle("git:get-remote-url", (_event, repoPath: string) => getRemoteBrowserUrl(repoPath));

ipcMain.handle("git:get-status", (_event, repoPath: string) => getRepoGitStatus(repoPath));

ipcMain.handle("config:get-favorites", () => getFavorites());

ipcMain.handle("config:toggle-favorite", (_event, repoPath: string) => toggleFavorite(repoPath));

ipcMain.handle("shell:copy-text", (_event, text: string) => {
  clipboard.writeText(text);
});

ipcMain.handle("window:hide", () => {
  mainWindow?.hide();
});

ipcMain.handle("shortcut:get", () => activeShortcut);

ipcMain.handle("shortcut:set", (_event, accelerator: string): TokenUpdateResult => {
  if (accelerator === activeShortcut) return { ok: true };

  const previous = activeShortcut;
  if (previous) globalShortcut.unregister(previous);

  const ok = globalShortcut.register(accelerator, () => toggleWindow());
  if (!ok) {
    if (previous) globalShortcut.register(previous, () => toggleWindow());
    return { ok: false, error: "No se pudo asignar esa combinación; puede estar en uso por otra app. Probá otra." };
  }

  activeShortcut = accelerator;
  setShortcut(accelerator);
  return { ok: true };
});

ipcMain.handle("app:get-autostart", () => app.getLoginItemSettings().openAtLogin);

ipcMain.handle("app:set-autostart", (_event, enabled: boolean) => {
  app.setLoginItemSettings({ openAtLogin: enabled });
  return app.getLoginItemSettings().openAtLogin;
});
