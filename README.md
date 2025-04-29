<div align="center">

# Dark Connect

![banner](static/images/banner.png)

</div>

## Overview

This is a simple browser extension designed to turn the Garmin Connect website into dark mode. Frustrated by the lack of a dark mode feature on Garmin Connect, I created this extension to enhance the browsing experience for users who prefer a darker interface, especially during nighttime use. The extension is lightweight, easy to install, and only affects connect.garmin.com and livetrack.garmin.com pages, leaving all other websites untouched.

## Features

- **Dark mode for Garmin Connect**: Instantly changes the theme of the Garmin Connect website to dark mode.
- **Preserved brand colors**: Retains the original colors of key elements, such as charts and recognizable brand features, while switching the background and other components to dark mode.
- **No impact on other websites**: The extension only affects `connect.garmin.com`, other pages remain unaffected.

## Screenshots

Here are some screenshots of the extension in action:

![screenshot1](static/images/screenshot1.png)

![screenshot2](static/images/screenshot2.png)

![screenshot3](static/images/screenshot3.png)

![screenshot4](static/images/screenshot4.png)

## Installation

### Chrome, Edge, Brave, Opera, Firefox

To install the extension, follow these simple steps:

1. **Download the extension** from your browser's extension store:
    - [**Chrome Web Store**](https://chromewebstore.google.com/detail/nadhhgppikppmjacnkebagbgcibnfnob) (Google Chrome 🌐, Brave 🦁, Opera 🔴, Microsoft Edge 🌀)
    - [**Mozilla Firefox**](https://addons.mozilla.org/en-US/firefox/addon/dark-connect/) 🦊

2. **Add the extension to your browser**: Once added, the extension will automatically turn your Garmin Connect page into dark mode.

3. **That's it!** No further configuration is required. Just browse Garmin Connect website in dark mode.

## Usage

Once installed, the extension will immediately apply dark mode to any visit to `connect.garmin.com`. You don’t need to enable or disable it manually — it works automatically whenever you visit the site. If you have suggestions for improvements or have found any bugs, feel free to report them through the issues form.

## Development & Build

This project uses a build system powered by Node.js to generate browser-specific builds for Chrome and Firefox, and to automatically version and package the extension.

### 🚀 Getting started

Make sure you have [Node.js](https://nodejs.org) installed on your system.

Then install dependencies:

```bash
npm install
```
### 🔧 How to build the extension

Builds are created using a single command:

```bash
npm run build:all
```
This will:
- Compile both Chrome and Firefox builds into `dist-chrome/` and `dist-firefox/`
- Inject the current version from `package.json` into the built `manifest.json`
- Package both builds into `chrome.zip` and `firefox.zip` (ready to publish)

You can also build them individually:

```bash
npm run build:chrome   # Build for Chrome, Brave, Opera, Edge
npm run build:firefox  # Build for Firefox
```
### 🏷️ Versioning

Version is controlled via `package.json`. To update the version:

```bash
npm version patch     # e.g. 1.1.0 → 1.1.1
npm version minor     # e.g. 1.1.1 → 1.2.1
npm version major     # e.g. 1.2.1 → 2.0.0
```
This will:
- Bump the version in package.json
- Tag the commit in Git (e.g. v2.0.0)
- Inject the version into `manifest.json` during the next build

### 🧪 Local testing (e.g. in Chrome)

To test the extension locally in a browser:

1. Run `npm run build:chrome`

2. Open `chrome://extensions`

3. Enable “Developer mode”

4. Click “Load unpacked” and select the `dist-chrome/` folder

5. The extension will now appear and function like a normal installed one