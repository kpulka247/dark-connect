import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { RELEASE_NOTES } from "../../src/whatsNew.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const extensionDir = path.resolve(here, "../../dist/darkconnect-chrome");
const GARMIN_PAGE =
  "https://connect.garmin.com/modern/profile/johnsmith/activity/1234567?x=1";

let context;
let worker;
let extensionId;

before(async () => {
  context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    args: [
      `--disable-extensions-except=${extensionDir}`,
      `--load-extension=${extensionDir}`,
    ],
  });
  const fixture = await readFile(path.join(here, "fixtures", "garmin.html"));
  await context.route("https://connect.garmin.com/**", (route) =>
    route.fulfill({ contentType: "text/html", body: fixture }),
  );
  worker =
    context.serviceWorkers()[0] ??
    (await context.waitForEvent("serviceworker"));
  extensionId = new URL(worker.url()).host;
});

after(async () => {
  await context?.close();
});

beforeEach(async () => {
  await worker.evaluate(() =>
    chrome.storage.local.set({ theme: "dark", showUpdateModal: false }),
  );
});

async function openGarminPage() {
  const page = await context.newPage();
  await page.goto(GARMIN_PAGE);
  await page.waitForSelector("#dark-connect-style", { state: "attached" });
  await page.waitForFunction(
    () => getComputedStyle(document.body).backgroundColor === "rgb(17, 17, 17)",
  );
  return page;
}

// Sends the popup's scan message to the Garmin tab from the service worker.
// The extension has no tabs permission, so the tab is found by asking each
// tab until one answers.
const scanGarminTab = () =>
  worker.evaluate(async () => {
    for (const tab of await chrome.tabs.query({})) {
      try {
        const reply = await chrome.tabs.sendMessage(tab.id, {
          type: "dark-connect:scan",
        });
        return { tabId: tab.id, reply };
      } catch {}
    }
    return null;
  });

test("applies the dark theme on Garmin pages", async () => {
  const page = await openGarminPage();
  const background = await page.$eval(
    "#handled",
    (el) => getComputedStyle(el).backgroundColor,
  );
  assert.notEqual(background, "rgb(255, 255, 255)");
  await page.close();
});

test("scan reports what the theme missed and nothing it handles", async () => {
  const page = await openGarminPage();
  const { reply } = await scanGarminTab();
  await page.close();

  assert.equal(reply.darkThemeOn, true);
  assert.equal(
    reply.page,
    "connect.garmin.com/modern/profile/:id/activity/:id",
  );

  const found = reply.findings.map((f) => `${f.kind} ${f.selector}`).sort();
  assert.deepEqual(found, [
    "dark-chart-text body > div > svg > text",
    "light-chart-shape rect.plot-bg",
    "light-surface div.legacy-panel",
    'light-surface div[class*="FoodItem_card_"]',
    'light-surface section[class*="Wrapper_box_"] div > div',
  ]);
  const card = reply.findings.find((f) => f.selector.includes("FoodItem"));
  assert.equal(card.property, "background-color");
  assert.equal(card.color, "#ffffff");
});

test("scan does not run while the light theme is on", async () => {
  const page = await openGarminPage();
  await worker.evaluate(() => chrome.storage.local.set({ theme: "light" }));
  await page.waitForSelector("#dark-connect-style", { state: "detached" });
  const { reply } = await scanGarminTab();
  await page.close();
  assert.deepEqual(reply, { darkThemeOn: false });
});

test("popup opens a prefilled GitHub issue", async () => {
  const page = await openGarminPage();
  const { tabId } = await scanGarminTab();

  const popup = await context.newPage();
  await popup.addInitScript((id) => {
    chrome.tabs.query = (_query, callback) => callback([{ id }]);
    chrome.tabs.create = ({ url }) => {
      window.openedUrl = url;
    };
    window.close = () => {};
  }, tabId);
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.click("#report-page");
  const opened = new URL(
    await popup
      .waitForFunction(() => window.openedUrl)
      .then((h) => h.jsonValue()),
  );
  await popup.close();
  await page.close();

  assert.equal(
    opened.origin + opened.pathname,
    "https://github.com/kpulka247/dark-connect/issues/new",
  );
  assert.equal(opened.searchParams.get("template"), "missed-element.yml");
  assert.equal(
    opened.searchParams.get("page"),
    "connect.garmin.com/modern/profile/:id/activity/:id",
  );
  assert.match(opened.searchParams.get("scan"), /FoodItem_card_/);
  assert.doesNotMatch(opened.searchParams.get("scan"), /Oatmeal/);
});

test("popup shows the version, theme hint and Ko-fi link", async () => {
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.waitForFunction(
    () => document.getElementById("theme-hint").textContent !== "",
  );
  const version = await worker.evaluate(
    () => chrome.runtime.getManifest().version,
  );
  assert.equal(await popup.textContent("#version"), `v${version}`);
  assert.equal(
    await popup.textContent("#theme-hint"),
    "Garmin Connect is always dark.",
  );
  await popup.click('label[for="theme-auto"]');
  assert.match(await popup.textContent("#theme-hint"), /Follows your device/);
  assert.equal(
    await worker.evaluate(
      async () => (await chrome.storage.local.get("theme")).theme,
    ),
    "auto",
  );
  assert.equal(
    await popup.getAttribute("#coffee", "href"),
    "https://ko-fi.com/kpulka",
  );
  assert.equal(await popup.locator("#coffee .coffee-steam").count(), 2);
  await popup.close();
});

test("popup explains when the tab is not a Garmin page", async () => {
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.click("#report-page");
  await popup.waitForFunction(
    () => document.getElementById("report-status").textContent !== "Scanning…",
  );
  assert.match(
    await popup.textContent("#report-status"),
    /isn't a Garmin Connect page/,
  );
  await popup.close();
});

test("shows the what's new modal once after an update", async () => {
  await worker.evaluate(() =>
    chrome.storage.local.set({ showUpdateModal: true, updateVersion: "9.9.9" }),
  );
  const page = await openGarminPage();
  await page.waitForSelector("#dc-modal-overlay.dc-visible");

  assert.equal(await page.textContent(".dc-version"), "Dark Connect v9.9.9");
  const firstNote = RELEASE_NOTES[0];
  const titles = await page.$$eval(".dc-section h3", (els) =>
    els.map((el) => el.textContent),
  );
  assert.deepEqual(
    titles,
    RELEASE_NOTES.map((note) => note.title),
  );
  if (firstNote.items) {
    const items = await page.$$eval(".dc-section:first-child li", (els) =>
      els.map((el) => el.textContent),
    );
    assert.deepEqual(items, firstNote.items);
  }

  assert.equal(
    await page.getAttribute(".dc-coffee", "href"),
    "https://ko-fi.com/kpulka",
  );
  const logoWidth = await page.$eval(".dc-logo", async (img) => {
    await img.decode().catch(() => {});
    return img.naturalWidth;
  });
  assert.ok(logoWidth > 0, "the logo did not load on the Garmin page");

  await page.hover(".dc-coffee");
  await page.waitForFunction(() => {
    const link = document.querySelector(".dc-coffee");
    return getComputedStyle(link).borderTopColor === "rgb(249, 137, 37)";
  });
  await page.waitForTimeout(250);
  assert.equal(
    await page.$eval(".dc-coffee svg", (svg) => getComputedStyle(svg).color),
    "rgb(249, 137, 37)",
  );
  await page.mouse.move(0, 0);

  await page.setViewportSize({ width: 1280, height: 600 });
  const okBottom = await page.$eval(
    "#dc-modal-ok-btn",
    (el) => el.getBoundingClientRect().bottom,
  );
  assert.ok(okBottom <= 600, `the button ends at ${okBottom}px`);

  await page.click("#dc-modal-ok-btn");
  await page.waitForSelector("#dc-modal-overlay", { state: "detached" });
  await page.waitForSelector("#dark-connect-modal-style", {
    state: "detached",
  });
  assert.equal(
    await worker.evaluate(
      async () =>
        (await chrome.storage.local.get("showUpdateModal")).showUpdateModal,
    ),
    false,
  );
  await page.close();
});
