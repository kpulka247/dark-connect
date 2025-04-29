const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const AdmZip = require('adm-zip');

const target = process.argv[2]; // 'chrome' or 'firefox'
if (!['chrome', 'firefox'].includes(target)) {
  console.error('Usage: node build.js chrome|firefox');
  process.exit(1);
}

const distDir = path.join(__dirname, `dist-${target}`);
const manifestSrc = path.join(__dirname, `manifest.${target}.json`);
const manifestDest = path.join(distDir, 'manifest.json');
const zipOutput = path.join(__dirname, `${target}.zip`);
const pkg = require('./package.json');

// Clean up dist
fse.removeSync(distDir);
fse.ensureDirSync(distDir);

// Copy source files
fse.copySync('src', distDir);

// Load and inject version into manifest
const manifest = JSON.parse(fs.readFileSync(manifestSrc, 'utf-8'));
manifest.version = pkg.version;
fs.writeFileSync(manifestDest, JSON.stringify(manifest, null, 2));

// Create ZIP
const zip = new AdmZip();
zip.addLocalFolder(distDir);
zip.writeZip(zipOutput);

console.log(`✅ Build complete for: ${target}`);
console.log(`📦 Created ZIP: ${zipOutput}`);
console.log(`📄 Manifest version: ${manifest.version}`);