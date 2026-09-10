import fs from "fs";
import path from "path";
import zlib from "zlib";

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const crcInput = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePng(width, height, isMaskable = false) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk("IHDR", ihdrData);

  // Raw image data: height rows, each starting with filter byte 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (isMaskable ? 0.48 : 0.42);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Gradient background (Navy to dark slate)
      const grad = y / height;
      let r = Math.round(30 + grad * 10);
      let g = Math.round(58 + grad * 15);
      let b = Math.round(138 - grad * 40);
      let a = 255;

      // Inner circle badge
      if (dist < radius) {
        // Subtle inner ring
        if (Math.abs(dist - radius * 0.9) < 2) {
          r = 96;
          g = 165;
          b = 250;
        }

        // Waves in bottom half
        const waveY1 = cy + radius * 0.2 + Math.sin((x / width) * Math.PI * 4) * (height * 0.04);
        const waveY2 = cy + radius * 0.5 + Math.sin((x / width) * Math.PI * 4 + 1) * (height * 0.04);

        if (y > waveY2 && y < cy + radius * 0.85) {
          r = 14;
          g = 165;
          b = 233;
        } else if (y > waveY1 && y < cy + radius * 0.85) {
          r = 56;
          g = 189;
          b = 248;
        }

        // Emergency pin in top half
        const pinDy = y - (cy - radius * 0.25);
        const pinDist = Math.sqrt(dx * dx + pinDy * pinDy);
        const pinRadius = radius * 0.35;

        if (pinDist < pinRadius) {
          if (pinDist < pinRadius * 0.35) {
            // White center
            r = 255;
            g = 255;
            b = 255;
          } else {
            // Red pin
            r = 239;
            g = 68;
            b = 68;
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk("IDAT", compressed);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.resolve("public/icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, "icon-192.png"), generatePng(192, 192, false));
fs.writeFileSync(path.join(iconsDir, "icon-512.png"), generatePng(512, 512, false));
fs.writeFileSync(path.join(iconsDir, "icon-maskable-192.png"), generatePng(192, 192, true));
fs.writeFileSync(path.join(iconsDir, "icon-maskable-512.png"), generatePng(512, 512, true));
fs.writeFileSync(path.join(iconsDir, "apple-icon.png"), generatePng(180, 180, false));

console.log("Successfully generated all PWA icons in public/icons/");
