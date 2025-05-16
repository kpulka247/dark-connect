const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');

const createConfig = (browser, mode) => {
    const isProduction = mode === 'production';
    const distBaseDir = path.resolve(__dirname, 'dist');
    const browserOutputDir = path.resolve(distBaseDir, browser);

    return {
        mode: mode,
        devtool: isProduction ? false : 'cheap-module-source-map',
        entry: {
            styles: './src/styles/index.css',
            background: './src/background.js',
        },
        output: {
            path: browserOutputDir,
            filename: '[name].js',
            clean: true,
        },
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',
                    ],
                },
            ],
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: 'styles/main.css',
            }),
            new CopyPlugin({
                patterns: [
                    {
                        from: `public/manifest.${browser}.json`,
                        to: 'manifest.json',
                    },
                    {
                        from: path.resolve(__dirname, 'public/icons'),
                        to: path.join(browserOutputDir, 'icons'),
                        noErrorOnMissing: true,
                    },
                ],
            }),
            new RemoveEmptyScriptsPlugin(),
            isProduction && new ZipPlugin({
                path: distBaseDir,
                filename: `${browser}-${require('./package.json').version}.zip`,
            }),
        ].filter(Boolean),
        optimization: {
            minimize: isProduction,
            minimizer: [
                '...',
                new CssMinimizerPlugin(),
            ],
        },
    };
};

// --- Main export ---
module.exports = (env, argv) => {
    const mode = argv.mode || 'development';
    console.log(`Webpack mode: ${mode}`);

    const chromeConfig = createConfig('chrome', mode);
    chromeConfig.name = 'chrome';

    const firefoxConfig = createConfig('firefox', mode);
    firefoxConfig.name = 'firefox';

    return [chromeConfig, firefoxConfig];
};