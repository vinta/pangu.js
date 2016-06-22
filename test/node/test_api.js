import { assert } from 'chai';
import { Pangu } from '../../dist/node/';
import path from 'path';

describe('NodePangu', function () {
  const nodePangu = new Pangu()

  describe('spacingFile()', function () {
    it('.txt', function (done) {
      nodePangu.spacingFile(path.resolve(__dirname, './text.txt'), function(err, result){
        assert.equal(result, '聖誕老人 Hohoho 三小' + '\n');
        done();
      })
    });
  });

  describe('spacingFilePromise()', function () {
    it('.txt', function (done) {
      nodePangu.spacingFilePromise(path.resolve(__dirname, './text.txt'))
      .then(function(result) {
        assert.equal(result, '聖誕老人 Hohoho 三小' + '\n');
        done();
      })
    });
  });

  describe('spacingFileSync()', function () {
    it('.txt', function (done) {
      var result = nodePangu.spacingFileSync(path.resolve(__dirname, './text.txt'))
      assert.equal(result, '聖誕老人 Hohoho 三小' + '\n');
      done();
    });
  });

});
