#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var import__ = __toESM(require("."));
const usage = `
usage: pangu [-h] [-v] [-t] [-f] text_or_path

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
`.trim();
const [, , ...args] = process.argv;
function printSpacingText(text) {
  if (typeof text === "string") {
    console.log(import__.default.spacingText(text));
  } else {
    console.log(usage);
    process.exit(1);
  }
}
function printSpacingFile(path) {
  if (typeof path === "string") {
    console.log(import__.default.spacingFileSync(path));
  } else {
    console.log(usage);
    process.exit(1);
  }
}
if (args.length === 0) {
  console.log(usage);
} else {
  switch (args[0]) {
    case "-h":
    case "--help":
      console.log(usage);
      break;
    case "-v":
    case "--version":
      console.log(import__.default.version);
      break;
    case "-t":
      printSpacingText(args[1]);
      break;
    case "-f":
      printSpacingFile(args[1]);
      break;
    default:
      printSpacingText(args[0]);
  }
}
process.exit(0);
//# sourceMappingURL=cli.cjs.map
