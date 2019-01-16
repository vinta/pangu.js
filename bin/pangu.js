#!/usr/bin/env node
'use strict'

var meow = require('meow');
var fs = require('fs');
var path = require("path");
var pangu = require('../src/node');

var cli = meow(`
  Usage:
    $ pangu "當你凝視著bug，bug也凝視著你"
    $ pangu -t "當你凝視著bug，bug也凝視著你"
    $ pangu -f file.txt

  Options:
    --text -t Input text
    --file -f Input file
    --output -o Output file

  Examples:
    $ pangu "與PM戰鬥的人，應當小心自己不要成為PM"
    與 PM 戰鬥的人，應當小心自己不要成為 PM
    $ pangu -t "當你凝視著bug，bug也凝視著你"
    當你凝視著 bug，bug 也凝視著你
    $ pangu -f file.txt
`, {
  flags: {
    text: {
      type: 'string',
      alias: 't'
    },
    file: {
      type: 'string',
      alias: 'f'
    },
    output: {
      type: 'string',
      alias: 'o'
    }
  }
});

var argv = process.argv;
var ENCODING = 'utf-8';

if (argv.length < 3) {
  cli.showHelp(1);
}

var input;
var outcome;
if (cli.input.length === 1) {
  input = cli.input[0]
}
if (cli.flags.text) {
  input = cli.flags.text
}

if (input) {
  outcome = pangu.spacing(input)
  console.log(outcome);

  if (cli.flags.output) {
    fs.writeFileSync(path.resolve(cli.flags.output), outcome, ENCODING);
  }
}
if (cli.flags.file) {
  var input = cli.flags.file;
  pangu.spacingFile(path.resolve(input), function(err, data) {
    // callback
    if (err) {
      console.error(err);
    } else {
      var output = cli.flags.output ? cli.flags.output : cli.flags.file;
      fs.writeFileSync(path.resolve(output), data, ENCODING);
    }
  });
}
