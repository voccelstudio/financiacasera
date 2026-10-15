// Genera los iconos PNG del PWA (sin dependencias externas).
// Diseño: fondo verde + casa blanca (icono de "finanzas caseras").
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });

function crc32(buf) {
  let c,
    table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function inTriangle(x, y, p1, p2, p3) {
  const s = (a, b, c) => (a[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (a[1] - c[1]);
  const d1 = s([x, y], p1, p2),
    d2 = s([x, y], p2, p3),
    d3 = s([x, y], p3, p1);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

function drawIcon(size) {
  const px = Buffer.alloc(size * size * 4);
  const bg = [22, 163, 74]; // verde
  const white = [255, 255, 255];
  const gold = [245, 158, 11];
  const door = [21, 128, 61];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      let c = bg;

      // Techo (triángulo)
      const roof = inTriangle(u, v, [0.5, 0.16], [0.16, 0.46], [0.84, 0.46]);
      // Cuerpo de la casa
      const body = u > 0.24 && u < 0.76 && v > 0.44 && v < 0.82;
      // Puerta
      const isDoor = u > 0.44 && u < 0.56 && v > 0.6 && v < 0.82;
      // Ventana (izq)
      const win = u > 0.3 && u < 0.4 && v > 0.52 && v < 0.62;
      // Moneda (círculo) encima
      const coin = (u - 0.74) ** 2 + (v - 0.24) ** 2 < 0.011 ** 2 * 4;

      if (roof || body) c = white;
      if (isDoor) c = door;
      if (win) c = gold;
      if (coin) c = gold;

      const i = (y * size + x) * 4;
      px[i] = c[0];
      px[i + 1] = c[1];
      px[i + 2] = c[2];
      px[i + 3] = 255;
    }
  }
  return px;
}

function encodePng(size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filtro: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  const png = encodePng(size, drawIcon(size));
  writeFileSync(join(outDir, `icon-${size}.png`), png);
  console.log(`✓ icon-${size}.png (${png.length} bytes)`);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#16a34a"/>
  <polygon points="50,16 16,46 84,46" fill="#fff"/>
  <rect x="24" y="44" width="52" height="38" fill="#fff"/>
  <rect x="44" y="60" width="12" height="22" fill="#15803d"/>
  <rect x="30" y="52" width="10" height="10" fill="#f59e0b"/>
  <circle cx="74" cy="24" r="5" fill="#f59e0b"/>
</svg>`;
writeFileSync(join(outDir, "icon.svg"), svg);
console.log("✓ icon.svg");
