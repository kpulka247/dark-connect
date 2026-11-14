import { FINDING_KINDS } from "./scan.js";

export const ISSUE_URL = "https://github.com/kpulka247/dark-connect/issues/new";
export const ISSUE_TEMPLATE = "missed-element.yml";

// GitHub rejects longer addresses.
const MAX_URL_LENGTH = 8000;
const PERSONAL_SEGMENT_AFTER = new Set(["profile", "connections"]);

export function anonymizePage(href) {
  const url = new URL(href);
  const segments = url.pathname.split("/");
  const cleaned = segments.map((segment, i) => {
    if (!segment) return segment;
    if (/\d/.test(segment) || PERSONAL_SEGMENT_AFTER.has(segments[i - 1])) {
      return ":id";
    }
    return segment;
  });
  return `${url.host}${cleaned.join("/")}`;
}

function describeColor(finding) {
  return finding.background
    ? `\`${finding.color}\` on \`${finding.background}\``
    : `\`${finding.color}\``;
}

export function formatFindings(findings, limit = findings.length) {
  if (findings.length === 0) {
    return "The scan found nothing. Please describe what looks wrong.";
  }
  const rows = findings
    .slice(0, limit)
    .map(
      (f) =>
        `| ${FINDING_KINDS[f.kind]} | \`${f.selector}\` | \`${f.property}\` | ${describeColor(f)} | ${f.count} |`,
    );
  const hidden = findings.length - Math.min(limit, findings.length);
  return [
    "| Problem | Selector | Property | Color | Elements |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
    ...(hidden > 0 ? ["", `${hidden} more finding(s) left out.`] : []),
  ].join("\n");
}

export function buildIssueUrl({ page, findings, version, browser }) {
  const build = (limit) => {
    const params = new URLSearchParams({
      template: ISSUE_TEMPLATE,
      title: `Missed element on ${page}`,
      page,
      scan: formatFindings(findings, limit),
      version: `${version} on ${browser}`,
    });
    return `${ISSUE_URL}?${params}`;
  };

  let limit = findings.length;
  let url = build(limit);
  while (url.length > MAX_URL_LENGTH && limit > 1) {
    limit = Math.floor(limit / 2);
    url = build(limit);
  }
  return url;
}
