import { test } from "node:test";
import assert from "node:assert/strict";
import {
  contrast,
  luminance,
  parseColor,
  stablePrefix,
  toHex,
} from "../../src/audit/scan.js";

test("stablePrefix keeps the part of a Garmin class name before the hash", () => {
  assert.equal(stablePrefix("FoodItem_title__HT8Dj"), "FoodItem_title_");
  assert.equal(
    stablePrefix("EventDetailsHeader_eventName__---jQ"),
    "EventDetailsHeader_eventName_",
  );
  assert.equal(
    stablePrefix("MapProviderContainer__layerControlButton__a1b2c"),
    "MapProviderContainer__layerControlButton_",
  );
});

test("stablePrefix ignores class names without a hash", () => {
  assert.equal(stablePrefix("page-sidebar"), null);
  assert.equal(stablePrefix("active"), null);
  assert.equal(stablePrefix("highcharts-plot-band"), null);
});

test("parseColor reads computed rgb and rgba values", () => {
  assert.deepEqual(parseColor("rgb(37, 37, 37)"), {
    r: 37,
    g: 37,
    b: 37,
    a: 1,
  });
  assert.deepEqual(parseColor("rgba(0, 0, 0, 0.5)"), {
    r: 0,
    g: 0,
    b: 0,
    a: 0.5,
  });
  assert.deepEqual(parseColor("rgb(255 255 255 / 40%)"), {
    r: 255,
    g: 255,
    b: 255,
    a: 0.4,
  });
  assert.equal(parseColor("transparent"), null);
  assert.equal(parseColor("none"), null);
});

test("luminance and contrast follow WCAG", () => {
  const black = { r: 0, g: 0, b: 0 };
  const white = { r: 255, g: 255, b: 255 };
  assert.equal(luminance(black), 0);
  assert.equal(luminance(white), 1);
  assert.equal(contrast(black, white), 21);
  assert.equal(contrast(white, black), 21);
});

test("toHex writes six digit colours", () => {
  assert.equal(toHex({ r: 37, g: 37, b: 37 }), "#252525");
  assert.equal(toHex({ r: 255, g: 0, b: 10.4 }), "#ff000a");
});
