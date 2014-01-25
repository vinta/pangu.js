beforeEach(function() {
  // https://github.com/karma-runner/karma/issues/481
  var path = '';
  if (typeof window.__karma__ !== 'undefined') {
    path += 'base/'
  }
  jasmine.getFixtures().fixturesPath = path + 'tests/fixtures/';
});
