const fs = require("fs");
const path = require("path");

const ICON_DIR = path.join(__dirname, "..", "build", "icons");
const OUT_PATH = path.join(__dirname, "..", "build", "icon.ico");
const SIZES = [16, 32, 48, 256];

function buildIco(sizes) {
  const images = sizes.map((size) => {
    const png = fs.readFileSync(path.join(ICON_DIR, `icon-${size}.png`));
    return { size, png };
  });

  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * images.length;
  let offset = headerSize + dirSize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4); // count

  const dirEntries = [];
  for (const { size, png } of images) {
    const entry = Buffer.alloc(dirEntrySize);
    const dim = size >= 256 ? 0 : size; // 0 means 256
    entry.writeUInt8(dim, 0); // width
    entry.writeUInt8(dim, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset
    offset += png.length;
    dirEntries.push(entry);
  }

  return Buffer.concat([header, ...dirEntries, ...images.map((i) => i.png)]);
}

const ico = buildIco(SIZES);
fs.writeFileSync(OUT_PATH, ico);
console.log(`wrote ${OUT_PATH} (${ico.length} bytes, sizes: ${SIZES.join(", ")})`);
