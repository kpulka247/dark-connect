const fs = require('fs-extra');
const path = require('path');

const newVersion = process.argv[2];
if (!newVersion) {
    console.error('❌ No version provided! Usage: node update-manifest-version.js <version>');
    process.exit(1);
}

const manifestFiles = [
    path.join(__dirname, '..', 'public', 'manifest.chrome.json'),
    path.join(__dirname, '..', 'public', 'manifest.firefox.json')
];

console.log(`🔧 Updating manifests to version: ${newVersion}`);

async function updateManifests() {
    for (const filePath of manifestFiles) {
        try {
            const manifest = await fs.readJson(filePath);
            manifest.version = newVersion;
            await fs.writeJson(filePath, manifest, { spaces: 2 });
            console.log(`✅ Updated: ${path.basename(filePath)}`);
        } catch (err) {
            console.error(`❌ Error updating ${filePath}:`, err);
        }
    }
}

updateManifests();