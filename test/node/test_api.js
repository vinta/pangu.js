const fs = require('fs');
const path = require('path');

const assert = require('chai').assert;

const Pangu = require('../../dist/node').Pangu;

describe('NodePangu', function () {
  const pangu = new Pangu();
  const fixtureDir = path.resolve(__dirname, '../_fixture');

  describe('spacingFile()', function () {
    it('performs on a text file (callback)', function (done) {
      pangu.spacingFile(`${fixtureDir}/test_file.txt`, function (err, data) {
        const expected = fs.readFileSync(`${fixtureDir}/test_file.expected.txt`);
        assert.equal(data, expected);
        done();
      });
    });
  });

  describe('spacingFile()', function () {
    it('performs on a text file (promise)', function (done) {
      pangu.spacingFile(`${fixtureDir}/test_file.txt`)
      .then(function (data) {
        const expected = fs.readFileSync(`${fixtureDir}/test_file.expected.txt`);
        assert.equal(data, expected);
        done();
      });
    });
  });

  describe('spacingFileSync()', function () {
    it('performs on a text file', function (done) {
      const data = pangu.spacingFileSync(`${fixtureDir}/test_file.txt`);
      const expected = fs.readFileSync(`${fixtureDir}/test_file.expected.txt`);
      assert.equal(data, expected);
      done();
    });
  });
});
