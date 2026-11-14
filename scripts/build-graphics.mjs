import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import sharp from "sharp";

const ICON_FILE = "public/icons/icon128.png";
const WORDMARK_FILE = "static/brand/connect-wordmark.svg";
const FONT = "Gill Sans MT, Gill Sans, Segoe UI, Arial, sans-serif";
const COLORS = {
  background: "#1a1a1a",
  text: "#ffffff",
  dark: "#939393",
  muted: "#9e9e9e",
};

const icon = `data:image/png;base64,${readFileSync(ICON_FILE).toString("base64")}`;
const wordmark = readFileSync(WORDMARK_FILE, "utf8");
const WORDMARK_RATIO = (() => {
  const [, , w, h] = wordmark.match(/viewBox="([^"]+)"/)[1].split(/\s+/);
  return Number(h) / Number(w);
})();

const SPARKLES = [
  { x: 46.6, y: 14.2, r: 12.2 },
  { x: 70.3, y: 26.7, r: 10.5 },
  { x: 53.7, y: 42.8, r: 8.8 },
];

const sparkle = ({ x, y, r }) => {
  const k = r * 0.16;
  return `M${x},${y - r}Q${x + k},${y - k} ${x + r},${y}Q${x + k},${y + k} ${x},${y + r}Q${x - k},${y + k} ${x - r},${y}Q${x - k},${y - k} ${x},${y - r}Z`;
};

const moon = (x, y, size) => `
  <g transform="translate(${x} ${y}) scale(${size / 82})" fill="${COLORS.text}">
    <path d="M26.7,0.7A42.4,42.4 0 1 0 81.7,56.7A40.6,40.6 0 0 1 26.7,0.7Z"/>
    <path d="${SPARKLES.map(sparkle).join("")}"/>
  </g>`;

const connect = (x, y, width) =>
  wordmark.replace(
    "<svg ",
    `<svg x="${x}" y="${y}" width="${width}" height="${width * WORDMARK_RATIO}" `,
  );

function banner() {
  const width = 1320;
  const height = 840;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${COLORS.background}"/>
  <image href="${icon}" x="66" y="66" width="160" height="160"/>
  ${moon(873, 117, 246)}
  <text x="870" y="363" text-anchor="end" font-family="${FONT}" font-weight="700" font-size="144" fill="${COLORS.dark}">DARK</text>
  ${connect(195, 363, 930)}
  <text x="660" y="660" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="46" letter-spacing="5" fill="${COLORS.text}">DARK MODE FOR GARMIN CONNECT</text>
</svg>`;
}

function marquee() {
  const width = 1400;
  const height = 560;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${COLORS.background}"/>
  ${moon(935, 115, 330)}
  <image href="${icon}" x="110" y="60" width="112" height="112"/>
  <text x="104" y="300" font-family="${FONT}" font-weight="700" font-size="124" fill="${COLORS.dark}">DARK</text>
  ${connect(110, 318, 640)}
  <text x="112" y="494" font-family="${FONT}" font-weight="700" font-size="32" letter-spacing="4" fill="${COLORS.muted}">DARK MODE FOR GARMIN CONNECT</text>
</svg>`;
}

mkdirSync("static/images", { recursive: true });
mkdirSync("static/store", { recursive: true });

const bannerSvg = Buffer.from(banner());
const bannerMask = Buffer.from(
  `<svg width="1320" height="840"><rect width="1320" height="840" rx="36" fill="#fff"/></svg>`,
);
await sharp(bannerSvg)
  .composite([{ input: bannerMask, blend: "dest-in" }])
  .png()
  .toFile("static/images/banner.png");
await sharp(bannerSvg)
  .resize(440, 280)
  .png()
  .toFile("static/store/promo-tile-440x280.png");
await sharp(Buffer.from(marquee()))
  .png()
  .toFile("static/store/marquee-1400x560.png");
copyFileSync(ICON_FILE, "static/store/store-icon-128.png");

console.log("Banner and store images generated.");
