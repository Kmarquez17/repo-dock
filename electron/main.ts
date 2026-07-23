import { app, BrowserWindow, Tray, Menu, ipcMain, dialog, nativeImage, screen } from "electron";
import * as path from "path";
import { getRootFolders, addRootFolder, updateRootFolder, removeRootFolder, configStore } from "./store";
import { scanRepos } from "./repoScanner";
import { detectInstalledIdes, openInIde } from "./ideDetector";
import { openInExplorer, openTerminal } from "./shellActions";
import { getRemoteInfo, updateRemoteToken } from "./gitRemote";

const isDev = !app.isPackaged;
const VITE_DEV_SERVER_URL = "http://localhost:5173";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

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
  } else {
    const { x, y } = getWindowPosition();
    mainWindow.setPosition(x, y);
    mainWindow.show();
    mainWindow.focus();
  }
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

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on("window-all-closed", () => {
  // Keep the app alive in the tray; only quit explicitly via the tray menu.
});

// ---- IPC handlers ----

ipcMain.handle("config:get-root-folders", () => getRootFolders());

ipcMain.handle("config:pick-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const folderPath = result.filePaths[0];
  return { path: folderPath, suggestedName: path.basename(folderPath) };
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

ipcMain.handle("window:hide", () => {
  mainWindow?.hide();
});
