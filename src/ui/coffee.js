// The coffee cup on the Ko-fi links in the popup and the what's new window.
// The two steam lines are animated in CSS (.coffee-steam).

export const KOFI_URL = "https://ko-fi.com/Y8Y71ERSZF";

const SVG_NS = "http://www.w3.org/2000/svg";
// The view box holds only the cup and saucer, so the icon centers on the
// text like any other icon. The steam is drawn above it, outside the box.
const STEAM = ["M7 -4c-1 1.1 1 2.1 0 3.2", "M10.5 -4c-1 1.1 1 2.1 0 3.2"];
const CUP = [
  "M3 2.5h11v4.5a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z",
  "M14 4h1.25a2.5 2.5 0 0 1 0 5H14",
  "M2 15h13",
];

function path(d, className) {
  const node = document.createElementNS(SVG_NS, "path");
  node.setAttribute("d", d);
  if (className) node.setAttribute("class", className);
  return node;
}

// Keep "icon" out of the class name: the dark theme forces any [class*="icon"]
// inside a hovered link to white, which would override the cup's color.
export function createCoffeeIcon() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "coffee-cup");
  svg.setAttribute("viewBox", "0 0 19 16");
  svg.setAttribute("aria-hidden", "true");
  svg.append(
    ...STEAM.map((d) => path(d, "coffee-steam")),
    ...CUP.map((d) => path(d)),
  );
  return svg;
}
