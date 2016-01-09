const readFile = require('fs').readFile;
const Pangu = require('../shared/core').Pangu;

class NodePangu extends Pangu {

  constructor(filePrefix = 'readable.') {
    super();

    this.filePrefix = filePrefix;
  }

  spacingFile(path, callback) {
    readFile(path, 'utf8', (err, data) => {
      if (err) {
        throw err;
      }

      callback(err, data);
    });
  }

  // spacingFileFromURL(url, callback) {
  // }
  //
  // spacingHTML(html, callback) {
  // }

}

const pangu = new NodePangu();

exports = module.exports = pangu;
exports.Pangu = NodePangu;
