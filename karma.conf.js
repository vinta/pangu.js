module.exports = function (config) {
  config.set({
    browsers: [
      'ChromeHeadless'
    ],
    files: [
      'node_modules/chai/chai.js',
      'dist/browser/pangu.js',
      'test/browser/*.js',
      'test/_fixture/*.html'
    ],
    frameworks: [
      'mocha'
    ],
    preprocessors: {
        'dist/browser/pangu.js': ['babel', 'coverage'],
        'test/browser/*.js': ['babel'],
        'test/_fixture/*.html': ['html2js']
    },
    reporters: [
      'mocha',
      'coverage'
    ],
    singleRun: true,
    coverageReporter: {
      type: 'lcov',
      subdir: '.'
    },
  });
};
