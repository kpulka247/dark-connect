// Sets the version in both browser manifests. semantic-release runs this
// before the build: node scripts/update-manifest-version.js <version>
const fs = require("node:fs");
const path = require("node:path");

const version = process.argv[2];
if (!version) {
  console.error("Usage: node scripts/update-manifest-version.js <version>");
  process.exit(1);
}

for (const browser of ["chrome", "firefox"]) {
  const file = path.join(__dirname, "..", "public", `manifest.${browser}.json`);
  const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
  manifest.version = version;
  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Updated ${path.basename(file)} to ${version}`);
}
