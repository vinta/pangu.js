var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var TerserPlugin = require('terser-webpack-plugin');
var webpack = require('webpack');

var packageInfo = require('./package.json');

var bannerTemplate = fs.readFileSync('src/browser/banner.txt', {encoding: 'utf8'});
var bannerText = _.template(bannerTemplate)(packageInfo);

var entryPath = './src/browser/pangu.js';

module.exports = {
  target: 'web',
  mode: 'production',
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
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules|node/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            presets: [
              [
                "@babel/preset-env",
                {
                  "modules": "umd"
                }
              ]
            ]
          }
        }
      }
    ]
  },
  devtool: false,
  optimization: {
    minimizer: [
      new TerserPlugin({
        include: /\.min\.js$/
      })
    ],
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: bannerText,
      raw: true,
      entryOnly: true
    })
  ]
}
