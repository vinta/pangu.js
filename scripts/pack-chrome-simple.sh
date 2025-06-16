#!/bin/bash
# Simple pack script for Chrome Extension - No build required

echo "Packaging Chrome Extension (using existing files)..."

# Create zip package directly
echo "Creating extension package..."
cd browser_extensions/chrome/
zip -r ../paranoid-auto-spacing.zip . \
  -x "*.DS_Store" \
  -x "*.v2.js" \
  -x "*v2.json" \
  -x "TESTING_CHECKLIST.md" \
  -x "BUILD.md" \
  -x ".DS_Store"
cd ../..

echo "✅ Extension package created: browser_extensions/paranoid-auto-spacing.zip"
echo "📦 Ready to upload to Chrome Web Store!"
echo ""
echo "Note: This uses the existing pangu.min.js file without rebuilding."