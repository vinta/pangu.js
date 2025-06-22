#!/bin/bash
echo "Building Chrome Extension..."

echo "1. Building browser bundle..."
npm run build

echo "2. Copying pangu.umd.js to extension..."
cp -f dist/browser/pangu.umd.js browser_extensions/chrome/vendors/pangu/pangu.umd.js

echo "3. Creating extension package..."
cd browser_extensions/chrome/
rm -f ../paranoid-auto-spacing.zip
zip -r ../paranoid-auto-spacing.zip . \
  -x "images/*" \
  -x "src/*" \
  -x "*.md" \
  -x "*.ts" \
  -x ".DS_Store"
cd ../..

echo "Ready to upload to Chrome Web Store!"
