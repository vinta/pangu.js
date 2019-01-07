const fs = require('fs');

const Pangu = require('../shared/core').Pangu;

class NodePangu extends Pangu {

  constructor(filePrefix = 'readable.') {
    super();

    this.filePrefix = filePrefix;
  }

  spacingFile(path, callback = () => {}) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return callback(err);
        }

        const spacingData = this.spacing(data);

        resolve(spacingData);
        return callback(null, spacingData);
      });
    });
  }

  spacingFileSync(path) {
    try {
      return this.spacing(fs.readFileSync(path, 'utf8'));
    } catch (err) {
      throw err;
    }
  }

}

const pangu = new NodePangu();

module.exports = pangu;
module.exports.default = pangu;
module.exports.Pangu = NodePangu;
