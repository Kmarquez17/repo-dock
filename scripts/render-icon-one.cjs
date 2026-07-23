const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

app.disableHardwareAcceleration();
app.setPath("userData", path.join(app.getPath("temp"), `repo-launcher-icon-render-${process.argv[2]}`));

const size = parseInt(process.argv[2], 10);
const OUT_DIR = path.join(__dirname, "..", "build", "icons");
const HTML_PATH = path.join(__dirname, "icon-source.html");

app.whenReady().then(async () => {
  try {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const win = new BrowserWindow({
      width: size,
      height: size,
      show: false,
      frame: false,
      transparent: true,
      backgroundColor: "#00000000",
      resizable: false,
    });

    await win.loadFile(HTML_PATH);
    await new Promise((resolve) => setTimeout(resolve, 200));

    const image = await win.webContents.capturePage();
    const outPath = path.join(OUT_DIR, `icon-${size}.png`);
    fs.writeFileSync(outPath, image.toPNG());
    console.log(`wrote ${outPath}`);
  } catch (err) {
    console.error(`failed size ${size}:`, err && err.message);
    process.exitCode = 1;
  } finally {
    app.quit();
  }
});
