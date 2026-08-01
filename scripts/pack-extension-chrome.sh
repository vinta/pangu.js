#!/bin/bash
echo "Building Chrome Extension..."

echo "Building library and extension..."
npm run build

echo "Creating extension package..."
cd browser-extensions/chrome/
rm -f ../paranoid-auto-spacing.zip
zip -r ../paranoid-auto-spacing.zip . \
  -x "images/*" \
  -x "src/*" \
  -x ".DS_Store" \
  -x "*/.DS_Store"
cd ../..

echo "Ready to upload to Chrome Web Store!"
