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

if (!['chrome', 'firefox'].includes(target)) {
  console.error('Usage: node build.js chrome|firefox');
  process.exit(1);
}

const srcDir = path.join(__dirname, '../src');
const stylesSrcDir = path.join(srcDir, 'styles');
const distBaseDir = path.join(__dirname, '../dist');
const distDir = path.join(distBaseDir, target);

const manifestSrc = path.join(__dirname, `../manifest.${target}.json`);
const manifestDest = path.join(distDir, 'manifest.json');

const zipOutput = path.join(distBaseDir, `${target}.zip`);
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
  console.log(`\n🔧 Building for: ${target} into ${distDir}`);

  // 1. Clean up target-specific directory
  await fse.remove(distDir);
  await fse.ensureDir(path.dirname(indexCssOut));

  // 2. Copy source files (excluding styles dir content)
  console.log(`📂 Copying source files to ${distDir}`);
  await fse.copy(srcDir, distDir, {
    filter: (src) => !src.startsWith(stylesSrcDir) // Skip src/styles
  });

  // 3. Copy and rename the correct manifest file
  console.log(`📝 Copying manifest ${path.basename(manifestSrc)} to ${manifestDest}`);
  await fse.copy(manifestSrc, manifestDest);

  // 4. Process and Optimize CSS
  console.log(`🎨 Processing CSS from ${indexCssPath}...`);
  const optimizedCss = await optimizeCss(indexCssPath, indexCssOut);
  await fs.promises.writeFile(indexCssOut, optimizedCss);
  console.log(`   CSS processed into ${indexCssOut}`);

  // 5. Create ZIP archive from the target-specific directory
  console.log(`📦 Creating ZIP archive: ${zipOutput}`);
  await fse.ensureDir(distBaseDir);
  const zip = new AdmZip();
  zip.addLocalFolder(distDir); // Add content from dist/chrome or dist/firefox
  zip.writeZip(zipOutput);

  console.log(`\n✅ Build complete for: ${target}`);
  console.log(`   Output directory: ${distDir}`);
  console.log(`   ZIP archive: ${zipOutput}`);
}

// --- Run Build ---
build().catch(error => {
  console.error('\n❌ Build failed!', error);
  process.exit(1);
});