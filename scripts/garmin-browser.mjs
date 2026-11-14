import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const extensionDir = path.join(root, "dist", "darkconnect-chrome");
const profileDir = path.join(root, ".sweep-profile");

export async function launch(viewport = { width: 1440, height: 900 }) {
  const context = await chromium.launchPersistentContext(profileDir, {
    channel: "chromium",
    headless: false,
    viewport,
    args: [
      `--disable-extensions-except=${extensionDir}`,
      `--load-extension=${extensionDir}`,
    ],
  });
  const worker =
    context.serviceWorkers()[0] ??
    (await context.waitForEvent("serviceworker"));
  await worker.evaluate(() => chrome.storage.local.set({ theme: "dark" }));
  return { context, worker };
}

// Cloudflare's check on the Garmin sign-in page never passes in a browser that
// Playwright controls, so sign-in happens in the same Chromium started as a
// plain browser.
export async function login() {
  const browser = spawn(
    chromium.executablePath(),
    [
      `--user-data-dir=${profileDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "https://connect.garmin.com/signin",
    ],
    { stdio: "ignore" },
  );
  console.log(
    "Sign in to Garmin Connect in the browser window, then close it.",
  );
  await new Promise((resolve) => browser.on("exit", resolve));
}

export const isSignInPage = (url) =>
  /sso\.garmin\.com|\/signin/.test(new URL(url).host + new URL(url).pathname);

export const isCloudflareCheck = (page) =>
  page
    .locator("#challenge-form, iframe[src*='challenges.cloudflare.com']")
    .count()
    .then((count) => count > 0);

// Scrolls to the bottom so that lazily loaded cards and charts render.
export async function scrollThrough(page) {
  await page.evaluate(async () => {
    const scrollers = [
      document.scrollingElement,
      ...[...document.querySelectorAll("*")].filter(
        (element) =>
          element.scrollHeight > element.clientHeight + 50 &&
          /auto|scroll/.test(getComputedStyle(element).overflowY),
      ),
    ];
    for (const scroller of scrollers) {
      for (let y = 0; y < scroller.scrollHeight; y += innerHeight / 2) {
        scroller.scrollTop = y;
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
      scroller.scrollTop = 0;
    }
  });
}
