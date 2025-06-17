#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Read the new version from package.json
const packageJsonPath = join(projectRoot, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const newVersion = packageJson.version;
console.log(`Updating version to ${newVersion} in all files...`);

// Update browser_extensions/chrome/manifest.json
const chromeManifestPath = join(projectRoot, 'browser_extensions/chrome/manifest.json');
const manifestContent = readFileSync(chromeManifestPath, 'utf8');
const updatedManifest = manifestContent.replace(/"version":\s*"[^"]+"/, `"version": "${newVersion}"`);
writeFileSync(chromeManifestPath, updatedManifest, 'utf8');
console.log(`✓ Updated ${chromeManifestPath}`);

// Update src/shared/index.ts
const sharedIndexPath = join(projectRoot, 'src/shared/index.ts');
const indexContent = readFileSync(sharedIndexPath, 'utf8');
const updatedIndex = indexContent.replace(/this\.version\s*=\s*['"][^'"]+['"]/, `this.version = '${newVersion}'`);
writeFileSync(sharedIndexPath, updatedIndex, 'utf8');
console.log(`✓ Updated ${sharedIndexPath}`);

console.log('Version update complete!');
