// One-off icon generator for the "Fork Dock" logo (Concept A).
// Rasterizes the SVG via a hidden BrowserWindow canvas (no extra npm deps),
// then packs the small sizes into a Vista-style PNG-based .ico.
const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");

const GRADIENT = `
  <linearGradient id="gA" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#8f7dff"/>
    <stop offset="1" stop-color="#5a4bdb"/>
  </linearGradient>
`;

// Full detail: used from 48px up.
const DETAILED = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <defs>${GRADIENT}</defs>
  <rect x="8" y="8" width="240" height="240" rx="56" fill="url(#gA)"/>
  <g stroke="#f2f1ff" stroke-width="12" fill="none" stroke-linecap="round">
    <path d="M96 84 v40 a28 28 0 0 0 28 28 h8"/>
    <path d="M160 84 v40 a28 28 0 0 1 -28 28 h-8"/>
    <line x1="128" y1="152" x2="128" y2="176"/>
  </g>
  <circle cx="96" cy="72" r="16" fill="#f2f1ff"/>
  <circle cx="160" cy="72" r="16" fill="#f2f1ff"/>
  <circle cx="128" cy="188" r="16" fill="#f2f1ff"/>
  <rect x="72" y="206" width="112" height="14" rx="7" fill="#f2f1ff" opacity="0.9"/>
</svg>`.trim();

// Simplified/bolder: used below 48px (16/24/32) so the fork reads at tray size.
const SIMPLE = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <defs>${GRADIENT}</defs>
  <rect x="8" y="8" width="240" height="240" rx="56" fill="url(#gA)"/>
  <g stroke="#f2f1ff" stroke-width="20" fill="none" stroke-linecap="round">
    <path d="M96 84 v40 a28 28 0 0 0 28 28 h8"/>
    <path d="M160 84 v40 a28 28 0 0 1 -28 28 h-8"/>
    <line x1="128" y1="152" x2="128" y2="176"/>
  </g>
  <circle cx="96" cy="72" r="18" fill="#f2f1ff"/>
  <circle cx="160" cy="72" r="18" fill="#f2f1ff"/>
  <circle cx="128" cy="188" r="18" fill="#f2f1ff"/>
</svg>`.trim();

function svgFor(size) {
  return size >= 48 ? DETAILED : SIMPLE;
}

async function rasterize(win, svg, size) {
  const svgBase64 = Buffer.from(svg).toString("base64");
  const html = `<!doctype html><html><body style="margin:0"><canvas id="c"></canvas><script>
    async function run() {
      const canvas = document.getElementById("c");
      canvas.width = ${size};
      canvas.height = ${size};
      const ctx = canvas.getContext("2d");
      const img = new Image();
      const done = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      img.src = "data:image/svg+xml;base64,${svgBase64}";
      await done;
      ctx.drawImage(img, 0, 0, ${size}, ${size});
      return canvas.toDataURL("image/png");
    }
  </script></body></html>`;
  await win.loadURL("data:text/html;base64," + Buffer.from(html).toString("base64"));
  const dataUrl = await win.webContents.executeJavaScript("run()");
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  return Buffer.from(base64, "base64");
}

function buildIco(pngBuffers) {
  // Vista-style ICO: directory + one entry per size, each entry's payload is
  // raw PNG bytes (supported by Windows for icons up to 256x256).
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const entries = [];
  const dataChunks = [];
  let offset = 6 + count * 16;

  for (const { size, buf } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height (0 = 256)
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset of image data
    entries.push(entry);
    dataChunks.push(buf);
    offset += buf.length;
  }

  return Buffer.concat([header, ...entries, ...dataChunks]);
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1024, height: 1024 });

  const root = path.join(__dirname, "..");
  const sizesForFolder = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
  const icoSizes = [16, 24, 32, 48, 64, 128, 256];

  const cache = new Map();
  async function getPng(size) {
    if (!cache.has(size)) {
      cache.set(size, await rasterize(win, svgFor(size), size));
    }
    return cache.get(size);
  }

  fs.mkdirSync(path.join(root, "build", "icons"), { recursive: true });
  fs.mkdirSync(path.join(root, "electron", "assets"), { recursive: true });

  for (const size of sizesForFolder) {
    const buf = await getPng(size);
    fs.writeFileSync(path.join(root, "build", "icons", `icon-${size}.png`), buf);
  }

  fs.writeFileSync(path.join(root, "build", "icon.png"), await getPng(1024));

  const icoBuffers = [];
  for (const size of icoSizes) {
    icoBuffers.push({ size, buf: await getPng(size) });
  }
  fs.writeFileSync(path.join(root, "build", "icon.ico"), buildIco(icoBuffers));

  fs.writeFileSync(path.join(root, "electron", "assets", "icon-16.png"), await getPng(16));
  fs.writeFileSync(path.join(root, "electron", "assets", "icon-32.png"), await getPng(32));
  fs.writeFileSync(path.join(root, "electron", "assets", "icon-256.png"), await getPng(256));

  console.log("Icons generated.");
  app.quit();
});
