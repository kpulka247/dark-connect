import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import CopyPlugin from "copy-webpack-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import RemoveEmptyScriptsPlugin from "webpack-remove-empty-scripts";
import ZipPlugin from "zip-webpack-plugin";

const root = path.dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(
  readFileSync(path.join(root, "package.json"), "utf8"),
);

const createConfig = (browser, mode) => {
  const isProduction = mode === "production";
  const distBaseDir = path.resolve(root, "dist");
  const browserOutputDir = path.resolve(distBaseDir, `darkconnect-${browser}`);

  return {
    name: browser,
    mode,
    devtool: isProduction ? false : "cheap-module-source-map",
    entry: {
      "styles/main": "./src/styles/index.css",
      "styles/popup": "./src/styles/popup.css",
      "styles/modal": "./src/styles/modal.css",
      background: "./src/background.js",
      popup: "./src/popup/popup.js",
      content: "./src/content.js",
    },
    output: {
      path: browserOutputDir,
      filename: "[name].js",
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({ filename: "[name].css" }),
      new CopyPlugin({
        patterns: [
          { from: `public/manifest.${browser}.json`, to: "manifest.json" },
          {
            from: path.resolve(root, "public/icons"),
            to: path.join(browserOutputDir, "icons"),
            noErrorOnMissing: true,
          },
          { from: "src/popup/popup.html", to: "popup.html" },
        ],
      }),
      new RemoveEmptyScriptsPlugin(),
      isProduction &&
        new ZipPlugin({
          path: distBaseDir,
          filename: `darkconnect-${version}-${browser}.zip`,
        }),
    ].filter(Boolean),
    optimization: {
      minimize: isProduction,
      minimizer: ["...", new CssMinimizerPlugin()],
    },
  };
};

export default (env, argv) => {
  const mode = argv.mode || "development";
  console.log(`Webpack mode: ${mode}`);
  return [createConfig("chrome", mode), createConfig("firefox", mode)];
};
