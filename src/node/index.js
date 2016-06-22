const fs = require('fs');

const Pangu = require('../shared/core').Pangu;

class NodePangu extends Pangu {

  constructor(filePrefix = 'readable.') {
    super();

    this.filePrefix = filePrefix;
  }

  spacingFile(path, callback = undefined) {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        throw err;
      }

      callback(err, this.spacing(data));

    });
  }

  spacingFilePromise(path) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, 'utf8', (err, data) => {
        if (err) {
          reject(err);
        }

        resolve(this.spacing(data));
      });
    })
  }

  spacingFileSync(path) {
    try {
      return this.spacing(fs.readFileSync(path, 'utf8'));
    } catch (err) {
      throw err;
    }
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
