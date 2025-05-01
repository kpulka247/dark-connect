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

// Copy all files from src except src/styles
fse.copySync('src', distDir, {
  filter: (src) => {
    const rel = path.relative(path.resolve(__dirname, 'src/styles'), src);
    return !src.includes(path.join('src', 'styles')) || rel.startsWith('..');
  }
});

// Inject version into manifest
const manifest = JSON.parse(fs.readFileSync(manifestSrc, 'utf-8'));
manifest.version = pkg.version;
fs.writeFileSync(manifestDest, JSON.stringify(manifest, null, 2));

// ===== BUILD CSS =====
const indexCssPath = path.join(__dirname, 'src/styles/index.css');
const indexCssDir = path.dirname(indexCssPath);
const indexCssOut = path.join(distDir, 'styles/main.css');
fse.ensureDirSync(path.dirname(indexCssOut));

let finalCss = '';
const rawLines = fs.readFileSync(indexCssPath, 'utf-8').split('\n');

for (const line of rawLines) {
  const importMatch = line.match(/@import\s+['"](.+)['"];/);
  if (importMatch) {
    const importPath = path.resolve(indexCssDir, importMatch[1]);
    if (fs.existsSync(importPath)) {
      const importedContent = fs.readFileSync(importPath, 'utf-8');
      finalCss += `\n/* === ${importMatch[1]} === */\n` + importedContent + '\n';
    } else {
      console.warn(`⚠️ Skipped missing import: ${importMatch[1]}`);
    }
  } else {
    finalCss += line + '\n';
  }
}

fs.writeFileSync(indexCssOut, finalCss);

// ===== ZIP OUTPUT =====
const zip = new AdmZip();
zip.addLocalFolder(distDir);
zip.writeZip(zipOutput);

console.log(`✅ Build complete for: ${target}`);
console.log(`📦 Created ZIP: ${zipOutput}`);
console.log(`📄 Manifest version: ${manifest.version}`);