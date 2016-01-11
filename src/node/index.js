const fs = require('fs');

const Pangu = require('../shared/core').Pangu;

class NodePangu extends Pangu {

  constructor(filePrefix = 'readable.') {
    super();

    this.filePrefix = filePrefix;
  }

  // TODO: 改用 promise
  spacingFile(path, callback = undefined) {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        throw err;
      }

      callback(err, data);
    });
  }

  // TODO
  // spacingFileFromURL(url, callback) {
  // }

  // TODO
  // spacingHTML(html, callback) {
  // }

}

const pangu = new NodePangu();

exports = module.exports = pangu;
exports.Pangu = NodePangu;
