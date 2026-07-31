#!/usr/bin/env node
import pangu from './index.js';

const usage = `
usage: pangu [-h] [-v] [-t | -f | -c] [text_or_path]

pangu.js -- Paranoid text spacing for good readability, to automatically insert whitespace between CJK and half-width characters (alphabetical letters, numerical digits and symbols).

positional arguments:
  text_or_path   the text or file path to apply spacing; omit it to read stdin when input is piped

optional arguments:
  -h, --help     show this help message and exit
  -v, --version  show program's version number and exit
  -t, --text     specify the input value is a text
  -f, --file     specify the input value is a file path
  -c, --check    check if text has proper spacing (exit 0 if yes, 1 if no)
`.trim();

const [, , ...args] = process.argv;

type Mode = '--text' | '--file' | '--check';

const modeFlags: Record<string, Mode> = {
  '-t': '--text',
  '--text': '--text',
  '-f': '--file',
  '--file': '--file',
  '-c': '--check',
  '--check': '--check',
};

// An explicit - always means stdin. A missing argument only falls back to stdin when something is actually piped in, so running pangu with no arguments in a terminal still prints
// the usage instead of waiting for input that never comes
function wantsStdin(arg: string | undefined) {
  return arg === '-' || (arg === undefined && !process.stdin.isTTY);
}

// Reading has to be async: readFileSync(0) throws EAGAIN once a pipe carries more than a buffer or two. console.log() puts a trailing newline back, so dropping one here passes piped
// input through byte for byte
async function readStdin() {
  process.stdin.setEncoding('utf8');
  const chunks: string[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(String(chunk));
  }
  return chunks.join('').replace(/\n$/, '');
}

function printSpacingText(text: string | undefined) {
  if (typeof text === 'string') {
    console.log(pangu.spacingText(text));
  } else {
    console.log(usage);
    process.exitCode = 1;
  }
}

function printSpacingFile(path: string | undefined) {
  if (typeof path === 'string') {
    console.log(pangu.spacingFileSync(path));
  } else {
    console.log(usage);
    process.exitCode = 1;
  }
}

function checkSpacing(text: string | undefined) {
  if (typeof text === 'string') {
    const hasProperSpacing = pangu.hasProperSpacing(text);
    if (!hasProperSpacing) {
      // Optionally print the corrected version to stderr for debugging
      console.error(`Corrected: ${pangu.spacingText(text)}`);
    }
    process.exitCode = hasProperSpacing ? 0 : 1;
  } else {
    console.log(usage);
    process.exitCode = 1;
  }
}

// Every exit goes through process.exitCode rather than process.exit(), because process.exit() truncates a piped stdout at one pipe buffer and pangu now streams whole files through it
async function main() {
  // -t, -f and -c are mutually exclusive
  const givenModes = new Set(args.filter((arg) => arg in modeFlags).map((flag) => modeFlags[flag]));
  if (givenModes.size > 1) {
    const [first, second] = [...givenModes];
    console.error(`pangu: error: argument ${second}: not allowed with argument ${first}`);
    console.log(usage);
    process.exitCode = 1;
    return;
  }

  if (args.length === 0) {
    printSpacingText(wantsStdin(undefined) ? await readStdin() : undefined);
    return;
  }

  switch (args[0]) {
    case '-h':
    case '--help':
      console.log(usage);
      break;
    case '-v':
    case '--version':
      console.log(`pangu.js ${pangu.version}`);
      break;
    case '-t':
    case '--text':
      printSpacingText(wantsStdin(args[1]) ? await readStdin() : args[1]);
      break;
    case '-f':
    case '--file':
      // A missing path with piped input means the text itself arrived on stdin, so there is no file to open
      if (wantsStdin(args[1])) {
        printSpacingText(await readStdin());
      } else {
        printSpacingFile(args[1]);
      }
      break;
    case '-c':
    case '--check':
      checkSpacing(wantsStdin(args[1]) ? await readStdin() : args[1]);
      break;
    case '-':
      printSpacingText(await readStdin());
      break;
    default:
      printSpacingText(args[0]);
  }
}

await main();
