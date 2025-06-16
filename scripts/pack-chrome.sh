#!/bin/bash
# Pack Chrome Extension

echo "Building Chrome Extension..."

# Build browser bundle
echo "1. Building browser bundle..."
npm run build

# Copy pangu.umd.js as pangu.min.js
echo "2. Copying pangu.umd.js to extension..."
cp -f dist/browser/pangu.umd.js browser_extensions/chrome/vendors/pangu/pangu.min.js

# Create zip package
echo "3. Creating extension package..."
cd browser_extensions/chrome/
zip -r ../paranoid-auto-spacing.zip . \
  -x "*.DS_Store" \
  -x "*.v2.js" \
  -x "TESTING_CHECKLIST.md" \
  -x "BUILD.md"
cd ../..

echo "✅ Extension package created: browser_extensions/paranoid-auto-spacing.zip"
echo "📦 Ready to upload to Chrome Web Store!"