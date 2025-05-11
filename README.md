<div align="center">

# Dark Connect

<a href="https://github.com/kpulka247/dark-connect/releases" title="GitHub Release"><img src="https://img.shields.io/github/v/release/kpulka247/dark-connect?logo=github&logoColor=white"></a>
<a href="https://chromewebstore.google.com/detail/dark-connect/nadhhgppikppmjacnkebagbgcibnfnob" title="Chrome Web Store Stars"><img src="https://img.shields.io/chrome-web-store/stars/nadhhgppikppmjacnkebagbgcibnfnob?logo=google%20chrome&logoColor=white"></a>
<a href="https://addons.mozilla.org/pl/firefox/addon/dark-connect/" title="Mozilla Add-on Stars"><img src="https://img.shields.io/amo/stars/dark-connect?logo=firefox&logoColor=white"></a>

<a href="https://github.com/kpulka247/dark-connect/blob/main/LICENSE" title="GitHub License"><img src="https://img.shields.io/github/license/kpulka247/dark-connect?color=%23252525"></a>
<a title="Chrome Web Store Size"><img src="https://img.shields.io/chrome-web-store/size/nadhhgppikppmjacnkebagbgcibnfnob"></a>

![banner](static/images/banner.png)

</div>

## Overview

This is a simple browser extension designed to turn the Garmin Connect website into dark mode. Frustrated by the lack of a dark mode feature on Garmin Connect, I created this extension to enhance the browsing experience for users who prefer a darker interface, especially during nighttime use. The extension is lightweight, easy to install, and only affects connect.garmin.com and livetrack.garmin.com pages, leaving all other websites untouched.

## Features

- 🌙 **Dark mode for Garmin Connect** — Applies a clean, modern dark theme
- 🎨 **Preserves brand identity** — Original Garmin colors and charts remain intact for visual consistency
- 🚫 **Scope-limited** — Affects only `connect.garmin.com`, `livetrack.garmin.com`, and `live.garmin.com`
- 🛠️ **Modular and maintainable styles** — Powered by organized CSS modules with support for variables

## Screenshots

Here are some screenshots of the extension in action:

![screenshot1](static/images/screenshot1.png)

![screenshot2](static/images/screenshot2.png)

![screenshot3](static/images/screenshot3.png)

![screenshot4](static/images/screenshot4.png)

## Installation

<div align="center">

<a href="https://chromewebstore.google.com/detail/dark-connect/nadhhgppikppmjacnkebagbgcibnfnob" title="Chrome Web Store Version"><img src="https://img.shields.io/chrome-web-store/v/nadhhgppikppmjacnkebagbgcibnfnob?style=for-the-badge&logo=google%20chrome&logoColor=white&labelColor=%23252525"></a>
<a href="https://addons.mozilla.org/pl/firefox/addon/dark-connect/" title="Mozilla Add-on Version"><img src="https://img.shields.io/amo/v/dark-connect?style=for-the-badge&logo=firefox&logoColor=white&labelColor=%23252525&color=red"></a>

</div>

To install the extension, click on your browser store and then add the extension to your browser. For 🦁 Brave, 🔴 Opera or 🌀 Microsoft Edge select Chrome Web Store.

## Usage

Once installed, the extension will immediately apply dark mode to any visit to Garmin Connect website. You don’t need to enable or disable it manually — it works automatically whenever you visit the site. If you have suggestions for improvements or have found any bugs, feel free to report them through the issues form.

## Development & Build

This project uses Node.js for its build system and leverages Conventional Commits with `semantic-release` for automated versioning and releases.

### 🚀 Getting started

Make sure you have:

- [Node.js](https://nodejs.org) (LTS version recommended) installed on your system
- [Git](https://git-scm.com/) for version control

Then install dependencies:

```bash
npm install
```
### 🔧 How to build the extension

Builds are created using npm scripts which invoke the build.js script:

```bash
# Build both Chrome and Firefox versions
npm run build:all

# Build only for Chrome (and compatible browsers)
npm run build:chrome

# Build only for Firefox
npm run build:firefox
```

- Generates browser-specific unpacked builds in the `dist/chrome/` and `dist/firefox/` directories.
- Combines and optimises CSS using PostCSS (`postcss-import`, `autoprefixer`, `cssnano`).
- Packs the builds into `.zip` files located in the `dist/` directory (e.g., `dist/chrome.zip`, `dist/firefox.zip`), ready for upload or distribution.

### 🧪 Local testing (e.g. in Chrome)

To test the extension locally in a browser:

1. Run `npm run build:chrome` to create the build in `dist/chrome/`
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" (usually a toggle in the top-right corner)
4. Click "Load unpacked"
5. Select the `dist/chrome/` folder generated in step 1
6. The extension will now appear in your list and function on the relevant Garmin pages

### 🏷️ Versioning and Releases (Automated)

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) and [Conventional Commits](https://www.conventionalcommits.org/) for automated version management and release publishing.

- **How it works:** When commits following the Conventional Commits specification (e.g., `feat: ...`, `fix: ...`, `perf: ...`, commits with `BREAKING CHANGE: ...`) are merged into the `main` branch, a GitHub Actions workflow automatically:

    1. Analyzes the commits since the last release
    2. Determines the next semantic version number (patch, minor, or major)
    3. Updates the `version` in `package.json` and `manifest.*.json` files
    4. Generates/updates the `CHANGELOG.md` file
    5. Commits these updated files
    6. Creates a Git tag for the new version (e.g., `v2.1.0`)
    7. Creates a GitHub Release with the generated changelog notes
- **Developers generally do not need to manually bump versions** using `npm version` for standard releases. The automation handles it based on commit messages.

## Development Notes

### 🗂️ Manifests

- `manifest.json`: Used only for local development. Not in the remote repository. Includes a full list of modular CSS files for easier debugging.
- `manifest.chrome.json` / `manifest.firefox.json`: Used during build. These use a single, compiled `styles/main.css` for faster loading and better performance.

### 🧰 Tools & Scripts

- `scripts/build.js`: Merges and compiles CSS, injects version into manifests.
- `scripts/update-manifest-version.js`: Replaces placeholders in manifests with the current version.
- `.releaserc.json`: Configures `semantic-release` pipeline.
- `release.yml`: GitHub Actions workflow to run the release pipeline automatically.

## Changelog

Changes for each release are automatically documented in the [CHANGELOG.md](./CHANGELOG.md) file.