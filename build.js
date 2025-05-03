const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const AdmZip = require('adm-zip');
const postcss = require('postcss');
const postcssImport = require('postcss-import');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

// --- Configuration ---
const target = process.argv[2];
const pkg = require('./package.json');

if (!['chrome', 'firefox'].includes(target)) {
  console.error('Usage: node build.js chrome|firefox');
  process.exit(1);
}

const distDir = path.join(__dirname, `dist-${target}`);
const srcDir = path.join(__dirname, 'src');
const stylesSrcDir = path.join(srcDir, 'styles');
const manifestSrc = path.join(__dirname, `manifest.${target}.json`);
const manifestDest = path.join(distDir, 'manifest.json');
const zipOutput = path.join(__dirname, `${target}.zip`);
const indexCssPath = path.join(stylesSrcDir, 'index.css'); // Input file path
const indexCssOut = path.join(distDir, 'styles/main.css'); // Output file path

// --- Helper Functions ---

/** Optimizes CSS using PostCSS, handling imports */
async function optimizeCss(inputPath, outputPath) {
  try {
    const css = await fs.promises.readFile(inputPath, 'utf-8'); // Load input file

    const processor = postcss([
      postcssImport(),
      autoprefixer,
      cssnano({ preset: 'default' })
    ]);

    const result = await processor.process(css, {
      from: inputPath,
      to: outputPath,
      map: false // No source maps in final build
    });
    return result.css;
  } catch (error) {
    console.error(`❌ CSS Processing failed for ${inputPath}:`, error);
    throw error; // Propagate error
  }
}

// --- Main Build Logic ---

async function build() {
  console.log(`\n🔧 Building for: ${target}`);

  // 1. Clean up
  await fse.remove(distDir);
  await fse.ensureDir(path.dirname(indexCssOut)); // Ensure styles dir exists

  // 2. Copy source files (excluding styles dir content)
  await fse.copy(srcDir, distDir, {
    filter: (src) => !src.startsWith(stylesSrcDir)
  });

  // 3. Process manifest
  const manifest = await fse.readJson(manifestSrc);
  manifest.version = pkg.version;
  await fse.writeJson(manifestDest, manifest, { spaces: 2 });

  // 4. Process and Optimize CSS (using PostCSS for imports and optimization)
  console.log(`🎨 Processing CSS from ${indexCssPath}...`);
  // Nie potrzebujemy już concatenateCss
  const optimizedCss = await optimizeCss(indexCssPath, indexCssOut);
  await fs.promises.writeFile(indexCssOut, optimizedCss);

  // 5. Create ZIP
  console.log(`📦 Creating ZIP archive...`);
  const zip = new AdmZip();
  zip.addLocalFolder(distDir);
  zip.writeZip(zipOutput);

  console.log(`\n✅ Build complete: ${target}.zip (v${manifest.version})`);
  console.log(`   Output directory: ${distDir}`);
}

// --- Run Build ---
build().catch(error => {
  console.error('\n❌ Build failed!', error);
  process.exit(1);
});