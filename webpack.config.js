const _ = require('underscore');
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

const packageInfo = require('./package.json');

const bannerTemplate = fs.readFileSync('src/browser/banner.txt', {encoding: 'utf8'});
const bannerText = _.template(bannerTemplate)(packageInfo);
const bannerPlugin = new webpack.BannerPlugin({
  banner: bannerText,
  include: /^pangu/,
  raw: true,
  entryOnly: true
});

const entryPath = './src/browser/pangu.js';

module.exports = {
  entry: {
    'pangu': entryPath,
    'pangu.min': entryPath
  },
  output: {
    path: path.resolve(__dirname, 'dist/browser/'),
    filename: '[name].js',
    library: 'pangu',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  devtool: 'source-map',
  plugins: [
    bannerPlugin
  ]
}
