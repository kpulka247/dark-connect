import { mkdirSync } from "node:fs";
import sharp from "sharp";
import { isSignInPage, launch, scrollThrough } from "./garmin-browser.mjs";

const README_DIR = "static/images";
const STORE_DIR = "static/store";
const WIDTH = 1280;
const HEIGHT = 800;
const FONT = "Gill Sans MT, Gill Sans, Segoe UI, Arial, sans-serif";
const BACKGROUND = "#1a1a1a";
const SETTLE_MS = 3000;

const PAGES = [
  {
    url: "https://connect.garmin.com/app/home",
    readme: "screenshot.png",
    store: "screenshot-1-dashboard.png",
    caption: "Garmin Connect, finally in dark mode.",
    withPopup: true,
  },
  {
    url: "https://connect.garmin.com/app/report/-1/all/last_six_months",
    readme: "screenshot-training.png",
    store: "screenshot-2-charts.png",
    caption: "Charts keep Garmin's own colors.",
    hideBanner: "Use Performance Dashboard",
  },
  {
    url: "https://connect.garmin.com/app/hrv-status",
    readme: "screenshot-hrv.png",
    store: "screenshot-3-hrv.png",
    caption: "Easy on the eyes, day and night.",
  },
  {
    url: "https://connect.garmin.com/app/training-readiness",
    readme: "screenshot-readiness.png",
    store: "screenshot-4-readiness.png",
    caption: "Every page and stat, themed by hand.",
  },
];
const POPUPS = {
  store: "screenshot-5-popup.png",
  caption: "Auto, Dark or Light. One click away.",
  themes: ["auto", "dark", "light"],
};

mkdirSync(README_DIR, { recursive: true });
mkdirSync(STORE_DIR, { recursive: true });

async function rounded(image, width, height, radius) {
  const mask = Buffer.from(
    `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="#fff"/></svg>`,
  );
  return sharp(image)
    .resize(width, height)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

const outline = (width, height, radius) =>
  Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${radius}" fill="none" stroke="#fff" stroke-opacity="0.12"/>
    </svg>`,
  );

async function withPopup(page, popup) {
  const { width, height } = await sharp(popup).metadata();
  const inset = 12;
  const left = WIDTH - inset - width;
  return sharp(await rounded(page, WIDTH, HEIGHT, 12))
    .composite([
      { input: await rounded(popup, width, height, 12), left, top: inset },
      { input: outline(width, height, 12), left, top: inset },
    ])
    .png()
    .toBuffer();
}

const escape = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/'/g, "&#39;");

async function frame(file, caption, shots) {
  const header = Buffer.from(
    `<svg width="${WIDTH}" height="120" xmlns="http://www.w3.org/2000/svg">
      <text x="${WIDTH / 2}" y="80" text-anchor="middle" font-family="${FONT}" font-size="44" font-weight="700" fill="#ffffff">${escape(caption)}</text>
    </svg>`,
  );
  const gap = 40;
  const boxHeight = HEIGHT - 120 - 48;
  const metas = await Promise.all(shots.map((shot) => sharp(shot).metadata()));
  const scale = Math.min(
    boxHeight / Math.max(...metas.map((m) => m.height)),
    (WIDTH - 96 - gap * (shots.length - 1)) /
      metas.reduce((sum, m) => sum + m.width, 0),
  );
  const sizes = metas.map((m) => ({
    width: Math.round(m.width * scale),
    height: Math.round(m.height * scale),
  }));
  const totalWidth =
    sizes.reduce((sum, s) => sum + s.width, 0) + gap * (shots.length - 1);
  const tallest = Math.max(...sizes.map((s) => s.height));
  let left = Math.round((WIDTH - totalWidth) / 2);
  const layers = [{ input: header, top: 0, left: 0 }];
  for (const [index, shot] of shots.entries()) {
    const { width, height } = sizes[index];
    const top = 120 + Math.round((boxHeight - tallest) / 2);
    layers.push(
      { input: await rounded(shot, width, height, 14), top, left },
      { input: outline(width, height, 14), top, left },
    );
    left += width + gap;
  }
  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite(layers)
    .png()
    .toFile(`${STORE_DIR}/${file}`);
}

async function pageShot(context, { url, hideBanner }) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "load", timeout: 60_000 });
  if (isSignInPage(page.url())) {
    console.error("Garmin signed you out. Run pnpm sweep --login first.");
    process.exit(1);
  }
  await page
    .waitForLoadState("networkidle", { timeout: 15_000 })
    .catch(() => {});
  await scrollThrough(page);
  await page.waitForTimeout(SETTLE_MS);
  if (hideBanner) {
    await page.evaluate((text) => {
      let box = [...document.querySelectorAll("*")].find(
        (element) =>
          element.childElementCount === 0 &&
          element.textContent.trim().startsWith(text),
      );
      while (box?.parentElement?.getBoundingClientRect().height < 100) {
        box = box.parentElement;
      }
      if (box) box.style.display = "none";
    }, hideBanner);
    await page.waitForTimeout(500);
  }
  const image = await page.screenshot();
  await page.close();
  return image;
}

async function popupShot(context, worker, theme) {
  await worker.evaluate(
    (value) => chrome.storage.local.set({ theme: value }),
    theme,
  );
  const id = new URL(worker.url()).host;
  const popup = await context.newPage();
  await popup.setViewportSize({ width: 320, height: 300 });
  await popup.goto(`chrome-extension://${id}/popup.html`);
  await popup.waitForTimeout(800);
  await popup.evaluate(() => {
    document.getElementById("version").textContent = "";
  });
  const image = await popup.screenshot({ fullPage: true });
  await popup.close();
  return image;
}

const { context, worker } = await launch({ width: WIDTH, height: HEIGHT });
const shots = [];
for (const page of PAGES) {
  process.stdout.write(`${page.url} ... `);
  shots.push({ ...page, image: await pageShot(context, page) });
  console.log("done");
}
const popups = [];
for (const theme of POPUPS.themes) {
  popups.push(await popupShot(context, worker, theme));
}
await worker.evaluate(() => chrome.storage.local.set({ theme: "dark" }));
await context.close();

const darkPopup = popups[POPUPS.themes.indexOf("dark")];
for (const shot of shots) {
  const readme = shot.withPopup
    ? await withPopup(shot.image, darkPopup)
    : await rounded(shot.image, WIDTH, HEIGHT, 12);
  await sharp(readme).toFile(`${README_DIR}/${shot.readme}`);
  await frame(shot.store, shot.caption, [shot.withPopup ? readme : shot.image]);
}
await frame(POPUPS.store, POPUPS.caption, popups);

console.log("Screenshots written to static/images and static/store.");
