#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Error: Version number required. Usage: npm run bump-version <x.y.z>');
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('Error: Invalid version format. Expected: x.y.z');
  process.exit(1);
}

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
const currentVersion = packageJson.version;

const parseVersion = (v) => v.split('.').map(Number);
const [currMajor, currMinor, currPatch] = parseVersion(currentVersion);
const [newMajor, newMinor, newPatch] = parseVersion(newVersion);

if (newMajor < currMajor || (newMajor === currMajor && newMinor < currMinor) || (newMajor === currMajor && newMinor === currMinor && newPatch <= currPatch)) {
  console.error(`Error: Version ${newVersion} must be greater than ${currentVersion}`);
  process.exit(1);
}

console.log(`Bumping version from ${currentVersion} to ${newVersion}...`);

execSync(`npm version ${newVersion} --no-git-tag-version`, { stdio: 'pipe' });

// Update version in other files
console.log('Updating version in other files...');

// Update browser-extensions/chrome/manifest.json
const chromeManifestPath = join(projectRoot, 'browser-extensions/chrome/manifest.json');
const manifestContent = readFileSync(chromeManifestPath, 'utf8');
const updatedManifest = manifestContent.replace(/"version":\s*"[^"]+"/, `"version": "${newVersion}"`);
writeFileSync(chromeManifestPath, updatedManifest, 'utf8');
console.log(`Updated ${chromeManifestPath}`);

// Update src/shared/index.ts
const sharedIndexPath = join(projectRoot, 'src/shared/index.ts');
const indexContent = readFileSync(sharedIndexPath, 'utf8');
const updatedIndex = indexContent.replace(/this\.version\s*=\s*['"][^'"]+['"]/, `this.version = '${newVersion}'`);
writeFileSync(sharedIndexPath, updatedIndex, 'utf8');
console.log(`Updated ${sharedIndexPath}`);

// Update examples/package.json
const examplesPackagePath = join(projectRoot, 'examples/package.json');
const examplesPackageContent = readFileSync(examplesPackagePath, 'utf8');
const updatedExamplesPackage = examplesPackageContent.replace(/"pangu":\s*"[\d.]+"/, `"pangu": "${newVersion}"`);
writeFileSync(examplesPackagePath, updatedExamplesPackage, 'utf8');
console.log(`Updated ${examplesPackagePath}`);

console.log(`Version bumped to ${newVersion}`);

// Pack extensions
console.log('Packing extensions...');
execSync('npm run pack-extension', { stdio: 'pipe' });

console.log('Done!');
