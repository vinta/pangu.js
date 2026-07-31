// Test the installed CLI (the package's bin entry)
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const pangu = require('pangu');

const cli = join(__dirname, 'node_modules', '.bin', 'pangu');

function run(args) {
  return execFileSync(cli, args, { encoding: 'utf8' }).trim();
}

console.log('=== Testing CLI ===\n');

// -v names the implementation, so a shadowed pangu.py install is distinguishable
const version = run(['-v']);
assert.equal(version, `pangu.js ${pangu.version}`);
console.log(`Version: ${version}`);

// The pangu-js alias resolves to this implementation regardless of PATH order
const aliasCli = join(__dirname, 'node_modules', '.bin', 'pangu-js');
assert.equal(execFileSync(aliasCli, ['-v'], { encoding: 'utf8' }).trim(), `pangu.js ${pangu.version}`);
console.log('Alias (pangu-js) works');

// Positional argument is treated as text
assert.equal(run(['當你凝視著bug，bug也凝視著你']), '當你凝視著 bug，bug 也凝視著你');
console.log('Spacing text (positional) works');

// -t text
assert.equal(run(['-t', '測試CLI參數']), '測試 CLI 參數');
console.log('Spacing text (-t) works');

// -f file
const filePath = join(tmpdir(), 'pangu-example-cli.txt');
writeFileSync(filePath, '當你凝視著bug，bug也凝視著你');
try {
  assert.equal(run(['-f', filePath]), '當你凝視著 bug，bug 也凝視著你');
  console.log('Spacing file (-f) works');
} finally {
  rmSync(filePath);
}

// Piped stdin is spaced like a positional argument
const piped = execFileSync(cli, [], { encoding: 'utf8', input: '當你凝視著bug，bug也凝視著你\n' });
assert.equal(piped, '當你凝視著 bug，bug 也凝視著你\n');
console.log('Spacing text (stdin) works');

// -c exits 0 for proper spacing, 1 otherwise
run(['-c', '當你凝視著 bug，bug 也凝視著你']);
console.log('Check (-c) passes on spaced text');

let checkExitCode = 0;
try {
  run(['-c', '當你凝視著bug']);
} catch (error) {
  checkExitCode = error.status;
}
assert.equal(checkExitCode, 1);
console.log('Check (-c) fails on unspaced text');

console.log('\nCLI working correctly!');
