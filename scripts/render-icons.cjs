const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

app.disableHardwareAcceleration();
app.setPath("userData", path.join(app.getPath("temp"), "repo-launcher-icon-render"));

const SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
const OUT_DIR = path.join(__dirname, "..", "build", "icons");
const HTML_PATH = path.join(__dirname, "icon-source.html");

async function renderSize(size) {
  const win = new BrowserWindow({
    width: size,
    height: size,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    resizable: false,
    webPreferences: {
      offscreen: false,
    },
  });

  await win.loadFile(HTML_PATH);
  await new Promise((resolve) => setTimeout(resolve, 150));

  const image = await win.webContents.capturePage();
  const outPath = path.join(OUT_DIR, `icon-${size}.png`);
  fs.writeFileSync(outPath, image.toPNG());
  win.destroy();
  await new Promise((resolve) => setTimeout(resolve, 100));
  console.log(`wrote ${outPath}`);
}

app.whenReady().then(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const size of SIZES) {
    try {
      await renderSize(size);
    } catch (err) {
      console.error(`failed size ${size}:`, err.message);
    }
  }
  app.quit();
});
