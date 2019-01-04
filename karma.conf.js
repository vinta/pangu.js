module.exports = function(config) {
  config.set({
    frameworks: [
      'mocha'
    ],
    browsers: [
      'ChromeHeadless'
    ],
    files: [
      'node_modules/chai/chai.js',
      'dist/browser/pangu.js',
      'test/browser/*.js',
      'test/_fixtures/*.html'
    ],
    preprocessors: {
        'dist/browser/pangu.js': ['coverage'],
        'test/_fixtures/*.html': ['html2js']
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
