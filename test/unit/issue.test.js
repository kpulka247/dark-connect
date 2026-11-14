import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ISSUE_TEMPLATE,
  anonymizePage,
  buildIssueUrl,
  formatFindings,
} from "../../src/audit/issue.js";

const finding = (selector, extra = {}) => ({
  kind: "light-surface",
  selector,
  property: "background-color",
  color: "#ffffff",
  background: null,
  count: 1,
  ...extra,
});

test("anonymizePage hides IDs, profile names and the query", () => {
  assert.equal(
    anonymizePage(
      "https://connect.garmin.com/modern/activity/123456789?token=abc",
    ),
    "connect.garmin.com/modern/activity/:id",
  );
  assert.equal(
    anonymizePage("https://connect.garmin.com/modern/profile/johnsmith"),
    "connect.garmin.com/modern/profile/:id",
  );
  assert.equal(
    anonymizePage("https://connect.garmin.com/modern/connections/janedoe"),
    "connect.garmin.com/modern/connections/:id",
  );
  assert.equal(
    anonymizePage("https://connect.garmin.com/modern/sleep/2026-11-14"),
    "connect.garmin.com/modern/sleep/:id",
  );
  assert.equal(
    anonymizePage("https://connect.garmin.com/modern/nutrition"),
    "connect.garmin.com/modern/nutrition",
  );
});

test("formatFindings writes one table row per finding", () => {
  const table = formatFindings([
    finding('div[class*="FoodItem_card_"]'),
    finding('span[class*="FoodItem_title_"]', {
      kind: "dark-text",
      property: "color",
      color: "#1a1a1a",
      background: "#252525",
      count: 3,
    }),
  ]);
  const lines = table.split("\n");
  assert.equal(lines.length, 4);
  assert.match(lines[2], /Light background.*FoodItem_card_.*#ffffff.*\| 1 \|/);
  assert.match(lines[3], /Dark text.*`#1a1a1a` on `#252525`.*\| 3 \|/);
});

test("formatFindings asks for a description when nothing was found", () => {
  assert.match(formatFindings([]), /found nothing/);
});

test("buildIssueUrl fills in the issue form fields", () => {
  const url = new URL(
    buildIssueUrl({
      page: "connect.garmin.com/modern/nutrition",
      findings: [finding('div[class*="FoodItem_card_"]')],
      version: "2.6.4",
      browser: "Chrome",
    }),
  );
  assert.equal(url.searchParams.get("template"), ISSUE_TEMPLATE);
  assert.equal(
    url.searchParams.get("page"),
    "connect.garmin.com/modern/nutrition",
  );
  assert.equal(url.searchParams.get("version"), "2.6.4 on Chrome");
  assert.match(url.searchParams.get("scan"), /FoodItem_card_/);
});

test("buildIssueUrl drops findings until the address is short enough", () => {
  const findings = Array.from({ length: 400 }, (_, i) =>
    finding(`div[class*="VeryLongComponentName${i}_someLocalClassName_"]`),
  );
  const href = buildIssueUrl({
    page: "connect.garmin.com/modern",
    findings,
    version: "2.6.4",
    browser: "Firefox",
  });
  assert.ok(href.length <= 8000, `length was ${href.length}`);
  assert.match(
    new URL(href).searchParams.get("scan"),
    /more finding\(s\) left out/,
  );
});
