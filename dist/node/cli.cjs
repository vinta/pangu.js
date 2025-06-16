#!/usr/bin/env node
"use strict";const a=require("./index.cjs"),t=`
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
`.trim(),[,,...s]=process.argv;function i(e){typeof e=="string"?console.log(a.pangu.spacingSync(e)):(console.log(t),process.exit(1))}function n(e){typeof e=="string"?console.log(a.pangu.spacingFileSync(e)):(console.log(t),process.exit(1))}if(s.length===0)console.log(t);else switch(s[0]){case"-h":case"--help":console.log(t);break;case"-v":case"--version":console.log(a.pangu.version);break;case"-t":i(s[1]);break;case"-f":n(s[1]);break;default:i(s[0])}process.exit(0);
//# sourceMappingURL=cli.cjs.map
