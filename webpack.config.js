var webpack = require('webpack');

var uglifyPlugin = new webpack.optimize.UglifyJsPlugin({
  include: /\.min\.js$/,
  minimize: true
})

var entryPath = './src/browser/index.js';

module.exports = {
  entry: {
    'pangu': entryPath,
    'pangu.min': entryPath
  },
  output: {
    path: './dist/browser/',
    filename: '[name].js',
    library: 'pangu',
    libraryTarget: 'umd'
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
    uglifyPlugin
  ]
}
