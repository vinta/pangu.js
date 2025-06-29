// CommonJS wrapper for node/index
// This file is copied to dist/node/index.cjs during build

// Import from the ES module build
const nodePangu = require('./index.js');

// Get the exports
const pangu = nodePangu.default || nodePangu.pangu;
const NodePangu = nodePangu.NodePangu;

// Add named exports to the default export for CommonJS compatibility
// This allows: const pangu = require('pangu')
pangu.NodePangu = NodePangu;
pangu.pangu = pangu;
pangu.default = pangu;

// Export pangu instance as the main export
module.exports = pangu;