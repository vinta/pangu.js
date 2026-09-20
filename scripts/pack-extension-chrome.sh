#!/bin/bash
set -e

echo "Building Chrome Extension..."
npm run build:extension

echo "Creating extension package..."
cd browser-extensions/chrome/
rm -f ../paranoid-auto-spacing.zip
zip -ry ../paranoid-auto-spacing.zip . \
  -x "images/*" \
  -x "node_modules/*" \
  -x "src/*" \
  -x "tests/*" \
  -x "package.json" \
  -x ".DS_Store" \
  -x "*/.DS_Store"
cd ../..

echo "Ready to upload to Chrome Web Store!"
