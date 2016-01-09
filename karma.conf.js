var webpackConfig = require('./webpack.config');
delete webpackConfig['entry'];
delete webpackConfig['output'];
delete webpackConfig['devtool'];

module.exports = function (config) {
  config.set({
    browsers: [
      'PhantomJS'
    ],
    files: [
      'dist/browser/pangu.js',
      'test/browser/*.js',
      'test/_fixture/*.html'
    ],
    frameworks: [
      'mocha'
    ],
    preprocessors: {
        'dist/browser/pangu.js': ['coverage'],
        'test/_fixture/*.html': ['html2js'],
        'test/browser/*.js': ['webpack']
    },
    reporters: [
      'mocha',
      'coverage'
    ],
    singleRun: true,
    coverageReporter: {
      dir: 'coverage/',
      type: 'lcov',
    },
    webpack: webpackConfig,
    webpackMiddleware: {
        noInfo: true
    }
  });
};
