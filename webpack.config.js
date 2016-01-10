var fs = require('fs');
var webpack = require('webpack');

var packageInfo = require('./package.json');

var uglifyPlugin = new webpack.optimize.UglifyJsPlugin({
  include: /\.min\.js$/,
  minimize: true
})

var bannerText = fs.readFileSync('src/browser/banner.txt');
var bannerTemplate = eval('`' + bannerText + '`');
var bannerPlugin = new webpack.BannerPlugin(bannerTemplate, {
  include: /^pangu/,
  raw: true,
  entryOnly: true
});

var entryPath = './src/browser/pangu.js';

module.exports = {
  entry: {
    'pangu': entryPath,
    'pangu.min': entryPath
  },
  output: {
    path: './dist/browser/',
    filename: '[name].js',
    library: 'pangu',
    libraryTarget: 'var'
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          plugins: ['add-module-exports'],
          presets: ['es2015']
        }
      }
    ]
  },
  plugins: [
    uglifyPlugin,
    bannerPlugin
  ]
}
