// The coffee cup on the Ko-fi links in the popup and the what's new window.
// The two steam lines are animated in CSS (.coffee-steam).

export const KOFI_URL = "https://ko-fi.com/Y8Y71ERSZF";

const SVG_NS = "http://www.w3.org/2000/svg";
const STEAM = ["M9 2.5c-1 1.2 1 2.3 0 3.5", "M13 2.5c-1 1.2 1 2.3 0 3.5"];
const CUP = [
  "M4.5 9h11v4.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z",
  "M15.5 10.5h1.25a2.75 2.75 0 0 1 0 5.5H15",
  "M3.5 21.5h14",
];

function path(d, className) {
  const node = document.createElementNS(SVG_NS, "path");
  node.setAttribute("d", d);
  if (className) node.setAttribute("class", className);
  return node;
}

export function createCoffeeIcon() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "coffee-icon");
  svg.setAttribute("viewBox", "0 0 22 23");
  svg.setAttribute("aria-hidden", "true");
  svg.append(
    ...STEAM.map((d) => path(d, "coffee-steam")),
    ...CUP.map((d) => path(d)),
  );
  return svg;
}
