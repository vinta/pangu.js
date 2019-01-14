#!/usr/bin/env node
'use strict'

const fs = require('fs');
const path = require("path");
const pangu = require('../src/node');

const argv = process.argv;
const ENCODING = 'utf-8';

if (argv.length < 3) {
  console.log('-: require a file as arguments');
  console.log('usage: pangu file\n');
  process.exit(1);
}

pangu.spacingFile(path.resolve(argv[2]), function(err, data) {
  // callback
  if (err) {
    console.error(err);
  } else {
    fs.writeFileSync(path.resolve(argv[2]), data, ENCODING);
  }
});
