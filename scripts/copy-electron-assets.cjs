const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC_DIR = path.join(ROOT, "electron");
const OUT_DIR = path.join(ROOT, "dist-electron");

fs.copyFileSync(path.join(SRC_DIR, "package.json"), path.join(OUT_DIR, "package.json"));

fs.cpSync(path.join(SRC_DIR, "assets"), path.join(OUT_DIR, "assets"), { recursive: true });

console.log("copied electron/package.json and electron/assets to dist-electron/");
