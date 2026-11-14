// Sets the version in both browser manifests. semantic-release runs this
// before the build: node scripts/update-manifest-version.js <version>
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const publicDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
);

const version = process.argv[2];
if (!version) {
  console.error("Usage: node scripts/update-manifest-version.js <version>");
  process.exit(1);
}

for (const browser of ["chrome", "firefox"]) {
  const file = path.join(publicDir, `manifest.${browser}.json`);
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  manifest.version = version;
  writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Updated ${path.basename(file)} to ${version}`);
}
