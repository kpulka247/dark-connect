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

## 📝 Pull Request Naming Convention (CRITICAL)

This project uses automated releases based on **Conventional Commits**. While you can name your local commits however you like, **the title of your Pull Request MUST follow a specific format and MUST be in English.**

When your PR is merged, your commits will be squashed into a single commit using your PR title. Our CI/CD pipeline depends on this format to automatically generate changelogs and publish new versions.

**Format for PR Title:**
`<type>: <Description>`

**Allowed types:**

- `fix:` - A bug fix (e.g., `fix: Correct heart rate chart background color in dark mode`)
- `feat:` - A new feature (e.g., `feat: Add support for new Garmin Connect activity page`)
- `refactor:` - A code change that neither fixes a bug nor adds a feature (e.g., `refactor: Optimize css variables usage`)
- `chore:` - Updating build tasks, configurations, etc. (e.g., `chore: Update dependencies`)
- `docs:` - Documentation only changes (e.g., `docs: Update README with new screenshots`)

**Important rules for the PR Title:**

1. The prefix (`fix:`, `feat:`, etc.) must be strictly lowercase.
2. The description must be in **English**.
3. **The first letter of the description MUST be capitalized.** (e.g., `fix: Fixed something` - NOT `fix: fixed something`).

## 🚀 Submitting a Pull Request

**IMPORTANT:** All Pull Requests must target the **`dev`** branch, not the `main` branch!

1. Create a new branch for your feature/fix from the `dev` branch (`git checkout -b feat/my-new-feature dev`).
2. Make your changes and test them locally.
3. Commit your changes locally.
4. Push to the branch (`git push origin feat/my-new-feature`).
5. Open a Pull Request on GitHub **targeting the `dev` branch**. Please fill out the PR template provided and ensure your PR title follows the convention above.
