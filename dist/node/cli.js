#!/usr/bin/env node
import { pangu } from "./index.js";
const usage = `
usage: pangu [-h] [-v] [-t] [-f] [-c] text_or_path

pangu.js -- Paranoid text spacing for good readability, to automatically
insert whitespace between CJK and half-width characters (alphabetical letters,
numerical digits and symbols).

positional arguments:
  text_or_path   the text or file path to apply spacing

optional arguments:
  -h, --help     show this help message and exit
  -v, --version  show program's version number and exit
  -t, --text     specify the input value is a text
  -f, --file     specify the input value is a file path
  -c, --check    check if text has proper spacing (exit 0 if yes, 1 if no)
`.trim();
const [, , ...args] = process.argv;
function printSpacingText(text) {
  if (typeof text === "string") {
    console.log(pangu.spacingText(text));
  } else {
    console.log(usage);
    process.exit(1);
  }
}
function printSpacingFile(path) {
  if (typeof path === "string") {
    console.log(pangu.spacingFileSync(path));
  } else {
    console.log(usage);
    process.exit(1);
  }
}
function checkSpacing(text) {
  if (typeof text === "string") {
    const hasProperSpacing = pangu.hasProperSpacing(text);
    if (!hasProperSpacing) {
      console.error(`Corrected: ${pangu.spacingText(text)}`);
    }
    process.exit(hasProperSpacing ? 0 : 1);
  } else {
    console.log(usage);
    process.exit(1);
  }
}
if (args.length === 0) {
  console.log(usage);
  process.exit(1);
} else {
  switch (args[0]) {
    case "-h":
    case "--help":
      console.log(usage);
      break;
    case "-v":
    case "--version":
      console.log(pangu.version);
      break;
    case "-t":
    case "--text":
      printSpacingText(args[1]);
      break;
    case "-f":
    case "--file":
      printSpacingFile(args[1]);
      break;
    case "-c":
    case "--check":
      checkSpacing(args[1]);
      break;
    default:
      printSpacingText(args[0]);
  }
}
process.exit(0);
//# sourceMappingURL=cli.js.map
