const fs = require('fs');
const path = require('path');

const assert = require('chai').assert;

const pangu = require('../../dist/node');

describe('NodePangu', () => {
  const fixtureDir = path.resolve(__dirname, '../_fixtures');

  describe('spacingFile()', () => {
    it('performs on a text file (callback)', (done) => {
      pangu.spacingFile(`${fixtureDir}/test_file.txt`, (err, data) => {
        const expected = fs.readFileSync(`${fixtureDir}/test_file.expected.txt`);
        assert.equal(data, expected);
        done();
      });
    });
  });

  describe('spacingFile()', () => {
    it('performs on a text file (promise)', (done) => {
      pangu.spacingFile(`${fixtureDir}/test_file.txt`)
      .then((data) => {
        const expected = fs.readFileSync(`${fixtureDir}/test_file.expected.txt`);
        assert.equal(data, expected);
        done();
      });
    });
  });

  describe('spacingFileSync()', () => {
    it('performs on a text file', (done) => {
      const data = pangu.spacingFileSync(`${fixtureDir}/test_file.txt`);
      const expected = fs.readFileSync(`${fixtureDir}/test_file.expected.txt`);
      assert.equal(data, expected);
      done();
    });
  });
});
