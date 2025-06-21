#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

function run(command) {
  console.log(`> ${command}`);
  execSync(command, { stdio: 'inherit', cwd: projectRoot });
}

// Clean dist directory
console.log('Cleaning dist directory...');
if (existsSync('dist')) {
  rmSync('dist', { recursive: true, force: true });
}

// Build everything with Vite (includes TypeScript declarations via vite-plugin-dts)
console.log('\nBuilding with Vite...');
run('npm run build:vite');

console.log('\n✓ Build completed successfully!');