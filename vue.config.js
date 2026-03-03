const webpack = require('webpack');
const fs = require('fs');

const packageJson = fs.readFileSync('./package-lock.json');
const spineVersion = JSON.parse(packageJson).dependencies['@pixi-spine/all-4.1'].version;

module.exports = {
  productionSourceMap: true,
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        PIXI_SPINE_VERSION: JSON.stringify(spineVersion),
      }),
      new webpack.ProvidePlugin({
        PIXI: 'pixi.js',
      }),
    ],
  },
  publicPath: './',
};
