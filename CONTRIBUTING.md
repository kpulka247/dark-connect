# Contributing to Dark Connect

First off, thank you for considering contributing to Dark Connect! It's people like you that make this tool better for everyone.

**I am very open to all kinds of contributions!** Whether you found a bug, have an idea for a new feature, or simply noticed a way to optimize the code or improve performance – your pull requests are highly welcome. Don't hesitate to suggest improvements!

## 🛠️ Local Development Setup

To get the project running locally on your machine:

1. **Fork the repository** on GitHub by clicking the "Fork" button in the top right corner.
2. **Clone your fork** to your local machine (replace `YOUR_GITHUB_USERNAME` with your actual username):
   ```bash
   git clone https://github.com/YOUR_GITHUB_USERNAME/dark-connect.git
   ```
3. **Install dependencies** (Make sure you have Node.js and `pnpm` installed):
   ```bash
   pnpm install
   ```
4. **Run the development build** (this builds the extension and watches for file changes):
   ```bash
   pnpm dev
   ```
5. **Load the extension in your browser**:
   - **Chrome:** Go to `chrome://extensions`, enable "Developer mode", click "Load unpacked", and select the `dist/darkconnect-chrome/` folder.
   - **Firefox:** Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on...", and select the `manifest.json` file inside `dist/darkconnect-firefox/`.

## 🎨 Fixing a part the dark theme missed

1. **Find the selector.** Open the page and click **Scan this page** in the popup, or run the scan from DevTools. To do that, open the console, change the context menu at the top from `top` to Dark Connect, and run `darkConnect.scan()`. Each row gives a selector, the property to change and its current color. The returned list also holds the matching elements, so you can inspect them.
2. **Check Garmin's own color variables first.** Run `darkConnect.lightTokens()` in the same console. It lists Garmin's CSS variables, such as `--color-darkui-surface-1`, that are still light. Overriding one of them in `src/styles/base/variables.css` fixes every feature that uses it, including ones you cannot see.
3. **Write the rule.** Garmin's class names look like `FoodItem_title__HT8Dj`, and the part after `__` changes with every Garmin release. Match the stable start instead: `[class*="FoodItem_title_"]`. Put rules for one page in `src/styles/modules/` and rules for shared parts, such as buttons or modals, in `src/styles/components/`. Use the color variables from `variables.css` rather than new color values.
4. **Check it.** Run `pnpm lint`. It fails if your rule copies or is overridden by an existing rule for the same selector, so search for the selector first and extend that rule instead.

### Refactoring styles

When you move, merge or remove rules without meaning to change any colors, prove it. Build before and after your change with `pnpm build`, then compare the two builds:

```bash
pnpm build && cp dist/darkconnect-chrome/styles/main.css before.css   # before your change
pnpm build                                                            # after your change
node scripts/compare-css.mjs before.css dist/darkconnect-chrome/styles/main.css
```

It lists every selector whose value changed, and every pair of conflicting rules whose order changed. The order matters because, when two rules with the same specificity match one element, the later one wins.

### Checking Garmin for changes

Garmin changes its pages without notice. `pnpm sweep` opens a list of Garmin pages with your own account, scans each one and writes a report with screenshots to `sweep-results/<date>/`. Findings that were not in the previous run are marked **New**.

```bash
pnpm exec playwright install chromium  # once
pnpm sweep --login                     # once. Sign in, then close the window
pnpm sweep                             # every page in scripts/sweep-pages.json
pnpm sweep sleep hrv                   # only pages whose address contains these words
```

Edit `scripts/sweep-pages.json` to add the pages your account can see, such as Garmin Connect+ features or pages for your devices. Your sign-in stays in `.sweep-profile/`, and both folders are ignored by Git.

`pnpm colors` checks text colors on the same pages. It reads each text color with the theme on and off, and lists text that turned link blue although Garmin did not draw it blue, blue links that lost their blue, and blue text in a shade other than the theme's link blue (`--link-color`). The report goes to `sweep-results/text-colors/report.md`. It accepts the same page filters as `pnpm sweep`.

### Updating the README and store images

```bash
pnpm graphics      # banner, promo tile, marquee and store icon
pnpm screenshots   # README screenshots and the captioned store screenshots
```

`pnpm graphics` draws everything from `scripts/build-graphics.mjs`, `static/brand/connect-wordmark.svg` and the icon in `public/icons/`. It needs the Gill Sans MT font, which comes with Windows. `pnpm screenshots` uses the same sign-in as `pnpm sweep`, so run `pnpm sweep --login` first if Garmin signed you out. Store images go to `static/store/`, and README images go to `static/images/`.

## 📝 Pull Request Naming Convention (CRITICAL)

This project uses automated releases based on **Conventional Commits**. While you can name your local commits however you like, **the title of your Pull Request MUST follow a specific format and MUST be in English.**

When your PR is merged, your commits will be squashed into a single commit using your PR title. Our CI/CD pipeline depends on this format to automatically generate changelogs and publish new versions.

**Format for PR Title:**
`<type>: <description>`

**Allowed types:**

- `fix:` - A bug fix (e.g., `fix: correct heart rate chart background color in dark mode`)
- `feat:` - A new feature (e.g., `feat: add support for new Garmin Connect activity page`)
- `refactor:` - A code change that neither fixes a bug nor adds a feature (e.g., `refactor: optimize css variables usage`)
- `chore:` - Updating build tasks, configurations, etc. (e.g., `chore: update dependencies`)
- `docs:` - Documentation only changes (e.g., `docs: update README with new screenshots`)

**PR title rules:**

1. Use a lowercase Conventional Commits prefix (`fix:`, `feat:`, etc.).
2. Write the description in **English** and lowercase sentence text.

## 🚀 Submitting a Pull Request

**IMPORTANT:** All Pull Requests must target the **`dev`** branch, not the `main` branch!

1. Create a new branch for your feature/fix from the `dev` branch (`git checkout -b feat/my-new-feature dev`).
2. Make your changes and test them locally.
3. Commit your changes locally.
4. Push to the branch (`git push origin feat/my-new-feature`).
5. Open a Pull Request on GitHub **targeting the `dev` branch**. Please fill out the PR template provided and ensure your PR title follows the convention above.
